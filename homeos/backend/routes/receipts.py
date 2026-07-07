import os
import requests
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from tools.receipt_parser import parse_receipt_text
from tools.db import get_db_connection
from datetime import datetime, timedelta

router = APIRouter()

class ReceiptRequest(BaseModel):
    raw_text: str
    purchase_date: str
    store_name: str

def _process_and_save_receipt(raw_text: str, purchase_date: str, store_name: str):
    valid_items, warnings = parse_receipt_text(raw_text)
    
    if not valid_items:
        raise HTTPException(status_code=400, detail={"message": "No valid items parsed from receipt.", "warnings": warnings})
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert receipt
        cursor.execute("INSERT INTO receipts (purchase_date, store_name) VALUES (?, ?)", (purchase_date, store_name))
        receipt_id = cursor.lastrowid
        
        total_expense = 0.0
        
        # Calculate expiry (default 7 days from purchase)
        try:
            p_date = datetime.strptime(purchase_date, "%Y-%m-%d")
        except ValueError:
            p_date = datetime.now()
            
        expiry_date = (p_date + timedelta(days=7)).strftime("%Y-%m-%d")
        
        for item in valid_items:
            # Insert receipt_item
            cursor.execute("""
                INSERT INTO receipt_items (receipt_id, name, quantity, unit, price)
                VALUES (?, ?, ?, ?, ?)
            """, (receipt_id, item['name'], item['quantity'], item['unit'], item['price']))
            
            total_expense += item['price']
            
            # Update inventory
            ing_lower = item['name'].lower()
            cursor.execute("SELECT quantity FROM Inventory WHERE LOWER(ingredient) = ?", (ing_lower,))
            row = cursor.fetchone()
            if row:
                try:
                    old_qty = float(row[0])
                    new_qty = old_qty + float(item['quantity'])
                    # Store as string to match existing schema
                    cursor.execute("UPDATE Inventory SET quantity = ?, original_quantity = ? WHERE LOWER(ingredient) = ?", (str(new_qty), str(new_qty), ing_lower))
                except ValueError:
                    cursor.execute("UPDATE Inventory SET quantity = ?, original_quantity = ? WHERE LOWER(ingredient) = ?", (item['quantity'], item['quantity'], ing_lower))
            else:
                cursor.execute("""
                    INSERT INTO Inventory (ingredient, quantity, original_quantity, unit, expiry_date)
                    VALUES (?, ?, ?, ?, ?)
                """, (item['name'], item['quantity'], item['quantity'], item['unit'], expiry_date))
                
        # Update monthly expenses
        month_year = p_date.strftime("%Y-%m")
        cursor.execute("SELECT total_expense FROM monthly_expenses WHERE month_year = ?", (month_year,))
        row = cursor.fetchone()
        if row:
            new_expense = row[0] + total_expense
            cursor.execute("UPDATE monthly_expenses SET total_expense = ? WHERE month_year = ?", (new_expense, month_year))
        else:
            cursor.execute("INSERT INTO monthly_expenses (month_year, total_expense) VALUES (?, ?)", (month_year, total_expense))
            
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
    return {
        "message": "Receipt processed successfully.",
        "receipt_id": receipt_id,
        "parsed_items": len(valid_items),
        "total_expense": total_expense,
        "warnings": warnings
    }

@router.post("/")
def add_receipt(req: ReceiptRequest):
    return _process_and_save_receipt(req.raw_text, req.purchase_date, req.store_name)

@router.get("/pantry")
def get_pantry():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ingredient as name FROM Inventory")
    rows = cursor.fetchall()
    conn.close()
    
    names = [row['name'] for row in rows]
    return names

@router.get("/inventory")
def get_inventory():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, ingredient as name, quantity as current_stock, unit, expiry_date FROM Inventory")
    rows = cursor.fetchall()
    conn.close()
    
    # Optional: fetch average price from receipt_items
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, AVG(price) as avg_price FROM receipt_items GROUP BY name")
    avg_prices = {row['name'].lower(): row['avg_price'] for row in cursor.fetchall()}
    conn.close()
    
    # Load fallback prices from prices.csv
    import os, csv
    market_prices = {}
    prices_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'prices.csv')
    if os.path.exists(prices_file):
        with open(prices_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                market_prices[row["item"].lower()] = float(row["price"])
                
    inventory_items = []
    for row in rows:
        item = dict(row)
        item_name = item['name'].lower()
        
        # Determine average price: Use receipt history, fallback to market price, or default to 0.0
        if item_name in avg_prices:
            item['avg_price'] = avg_prices[item_name]
        elif item_name in market_prices:
            item['avg_price'] = market_prices[item_name]
        else:
            item['avg_price'] = 0.0
            
        inventory_items.append(item)
        
    return inventory_items
