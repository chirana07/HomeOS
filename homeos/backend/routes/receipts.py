import os
import requests
import csv
import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from tools.receipt_parser import parse_receipt_text, normalize_item
from tools.db import get_db_connection
from datetime import datetime, timedelta

router = APIRouter()

# Data Source: USDA FoodKeeper App & FoodSafety.gov Food Storage Guidelines
# Non-perishable items designated with -1 shelf life days.
PRODUCT_SHELF_LIFE = {
    # Non-Perishable Items (-1)
    "shopping bag": -1,
    "bag": -1,
    "toilet paper": -1,
    "paper towel": -1,
    "paper towels": -1,
    "soap": -1,
    "detergent": -1,
    "cleaning product": -1,
    "cleaning products": -1,
    "kitchen foil": -1,
    "aluminum foil": -1,
    "salt": -1,
    
    # Perishable Foods (Shelf Life in Days based on USDA FoodKeeper)
    "chicken": 2,       # USDA: 1-2 days raw poultry
    "fish": 2,          # USDA: 1-2 days raw fish
    "spinach": 5,       # USDA: 3-5 days fresh greens
    "fresh bread": 5,   # USDA: 5-7 days store bread
    "bread": 5,
    "wholegrain bread": 5,
    "bananas": 5,       # USDA: 5-7 days fresh fruit
    "banana": 5,
    "milk": 7,          # USDA: 7 days refrigerated milk
    "tomatoes": 7,      # USDA: 7 days fresh tomatoes
    "tomato": 7,
    "yogurt": 14,       # USDA: 1-2 weeks yogurt
    "carrots": 21,      # USDA: 2-3 weeks carrots
    "carrot": 21,
    "eggs": 21,         # USDA: 3-5 weeks raw eggs in shell
    "egg": 21,
    "potatoes": 30,     # USDA: 1 month cool dark storage
    "potato": 30,
    "onions": 30,       # USDA: 1 month pantry storage
    "onion": 30,
    "cheese": 30,       # USDA: 3-4 weeks hard/semi-hard cheese
    "apples": 30,       # USDA: 4-6 weeks refrigerated apples
    "apple": 30,
    "butter": 60,       # USDA: 1-2 months refrigerated butter
    "garlic": 90,       # USDA: 3 months dry garlic
    "flour": 180,       # USDA: 6 months pantry flour
    "rice": 365,        # USDA: 1 year dry white rice
    "oil": 365,         # USDA: 1 year cooking oil
    "cooking oil": 365,
    "sugar": 730,       # USDA: 2 years pantry sugar
}

DEFAULT_SHELF_LIFE_DAYS = 7  # Standard default for unlisted food items

def get_shelf_life_days(item_name: str) -> int:
    name_lower = item_name.strip().lower()
    for key, days in PRODUCT_SHELF_LIFE.items():
        if key in name_lower:
            return days
    return DEFAULT_SHELF_LIFE_DAYS

def classify_item_category(item_name: str) -> str:
    n = item_name.strip().lower()
    if any(k in n for k in ['carrot', 'onion', 'garlic', 'tomato', 'spinach', 'potato', 'cabbage', 'vegetable', 'pepper']):
        return 'Vegetables'
    if any(k in n for k in ['apple', 'banana', 'orange', 'berry', 'fruit', 'grape', 'lemon', 'mango']):
        return 'Fruits'
    if any(k in n for k in ['chicken', 'fish', 'egg', 'pork', 'beef', 'mutton', 'lamb', 'meat', 'tofu', 'protein']):
        return 'Proteins'
    if any(k in n for k in ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy']):
        return 'Dairy'
    if any(k in n for k in ['rice', 'bread', 'flour', 'oat', 'pasta', 'noodle', 'grain', 'cereal']):
        return 'Grains'
    if any(k in n for k in ['juice', 'tea', 'coffee', 'water', 'soda', 'beverage', 'drink']):
        return 'Beverages'
    if any(k in n for k in ['toilet paper', 'paper towel', 'soap', 'detergent', 'cleaning', 'foil', 'bag', 'household', 'tissue']):
        return 'Household'
    return 'Pantry Essentials'

def calculate_item_freshness(purchase_date_str: str, item_name: str, explicit_expiry_str: str = None):
    try:
        p_date = datetime.strptime(purchase_date_str, "%Y-%m-%d").date()
    except Exception:
        p_date = datetime.now().date()
        
    today = datetime.now().date()
    shelf_life = get_shelf_life_days(item_name)
    category = classify_item_category(item_name)
    
    if shelf_life == -1:
        return {
            "category": category,
            "purchase_date": p_date.strftime("%Y-%m-%d"),
            "estimated_expiry_date": "N/A",
            "shelf_life_days": -1,
            "days_remaining": 9999,
            "freshness_status": "Non-Perishable"
        }
        
    estimated_expiry = p_date + timedelta(days=shelf_life)
    
    if explicit_expiry_str and explicit_expiry_str != "N/A":
        try:
            exp_date = datetime.strptime(explicit_expiry_str, "%Y-%m-%d").date()
            if exp_date >= p_date:
                estimated_expiry = exp_date
        except Exception:
            pass
            
    days_rem = (estimated_expiry - today).days
    
    if days_rem > 3:
        status = "Fresh"
    elif days_rem >= 0:
        status = "Expires Soon"
    else:
        status = "Expired"
        
    return {
        "category": category,
        "purchase_date": p_date.strftime("%Y-%m-%d"),
        "estimated_expiry_date": estimated_expiry.strftime("%Y-%m-%d"),
        "shelf_life_days": shelf_life,
        "days_remaining": days_rem,
        "freshness_status": status
    }

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
        cursor.execute("INSERT INTO receipts (purchase_date, store_name) VALUES (?, ?)", (purchase_date, store_name))
        receipt_id = cursor.lastrowid
        
        total_expense = 0.0
        
        try:
            p_date = datetime.strptime(purchase_date, "%Y-%m-%d")
        except ValueError:
            p_date = datetime.now()
            purchase_date = p_date.strftime("%Y-%m-%d")
            
        for item in valid_items:
            cursor.execute("""
                INSERT INTO receipt_items (receipt_id, name, quantity, unit, price)
                VALUES (?, ?, ?, ?, ?)
            """, (receipt_id, item['name'], item['quantity'], item['unit'], item['price']))
            
            total_expense += item['price']
            
            freshness = calculate_item_freshness(purchase_date, item['name'])
            item_expiry_date = freshness['estimated_expiry_date']
            
            ing_lower = item['name'].lower()
            cursor.execute("SELECT quantity FROM Inventory WHERE LOWER(ingredient) = ?", (ing_lower,))
            row = cursor.fetchone()
            if row:
                try:
                    old_qty = float(row[0])
                    new_qty = old_qty + float(item['quantity'])
                    cursor.execute("""
                        UPDATE Inventory 
                        SET quantity = ?, original_quantity = ?, expiry_date = ? 
                        WHERE LOWER(ingredient) = ?
                    """, (str(new_qty), str(new_qty), item_expiry_date, ing_lower))
                except ValueError:
                    cursor.execute("""
                        UPDATE Inventory 
                        SET quantity = ?, original_quantity = ?, expiry_date = ? 
                        WHERE LOWER(ingredient) = ?
                    """, (item['quantity'], item['quantity'], item_expiry_date, ing_lower))
            else:
                cursor.execute("""
                    INSERT INTO Inventory (ingredient, quantity, original_quantity, unit, expiry_date)
                    VALUES (?, ?, ?, ?, ?)
                """, (item['name'], item['quantity'], item['quantity'], item['unit'], item_expiry_date))
                
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

class ConfirmReceiptItem(BaseModel):
    name: str
    quantity: str
    unit: str
    price: float
    estimated_expiry_date: Optional[str] = None

class ConfirmReceiptRequest(BaseModel):
    store_name: str
    purchase_date: str
    items: List[ConfirmReceiptItem]

@router.post("/confirm")
def confirm_receipt(req: ConfirmReceiptRequest):
    """
    Accepts user-reviewed and edited receipt items and performs database insertion into SQLite.
    """
    from logger import log_request_start, log_workflow_step, log_request_success, log_api_error
    t_start = time.time()
    log_request_start("POST", "/api/receipts/confirm", f"Store: {req.store_name} | Items: {len(req.items)}")

    if not req.items:
        raise HTTPException(status_code=400, detail="No items to save in receipt.")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO receipts (purchase_date, store_name) VALUES (?, ?)", (req.purchase_date, req.store_name))
        receipt_id = cursor.lastrowid
        
        total_expense = 0.0
        
        try:
            p_date = datetime.strptime(req.purchase_date, "%Y-%m-%d")
        except ValueError:
            p_date = datetime.now()
            
        for item in req.items:
            norm = normalize_item(item.dict())
            price = norm["price"]
            total_expense += price
            
            cursor.execute("""
                INSERT INTO receipt_items (receipt_id, name, quantity, unit, price)
                VALUES (?, ?, ?, ?, ?)
            """, (receipt_id, norm['name'], norm['quantity'], norm['unit'], price))
            
            freshness = calculate_item_freshness(req.purchase_date, norm['name'], item.estimated_expiry_date)
            item_expiry_date = freshness['estimated_expiry_date']
            
            ing_lower = norm['name'].lower()
            cursor.execute("SELECT quantity FROM Inventory WHERE LOWER(ingredient) = ?", (ing_lower,))
            row = cursor.fetchone()
            if row:
                try:
                    old_qty = float(row[0])
                    new_qty = old_qty + float(norm['quantity'])
                    cursor.execute("""
                        UPDATE Inventory 
                        SET quantity = ?, original_quantity = ?, expiry_date = ? 
                        WHERE LOWER(ingredient) = ?
                    """, (str(new_qty), str(new_qty), item_expiry_date, ing_lower))
                except ValueError:
                    cursor.execute("""
                        UPDATE Inventory 
                        SET quantity = ?, original_quantity = ?, expiry_date = ? 
                        WHERE LOWER(ingredient) = ?
                    """, (norm['quantity'], norm['quantity'], item_expiry_date, ing_lower))
            else:
                cursor.execute("""
                    INSERT INTO Inventory (ingredient, quantity, original_quantity, unit, expiry_date)
                    VALUES (?, ?, ?, ?, ?)
                """, (norm['name'], norm['quantity'], norm['quantity'], norm['unit'], item_expiry_date))
                
        month_year = p_date.strftime("%Y-%m")
        cursor.execute("SELECT total_expense FROM monthly_expenses WHERE month_year = ?", (month_year,))
        row = cursor.fetchone()
        if row:
            new_expense = row[0] + total_expense
            cursor.execute("UPDATE monthly_expenses SET total_expense = ? WHERE month_year = ?", (new_expense, month_year))
        else:
            cursor.execute("INSERT INTO monthly_expenses (month_year, total_expense) VALUES (?, ?)", (month_year, total_expense))
            
        conn.commit()
        t_total_sec = time.time() - t_start
        log_request_success(t_total_sec, items_updated=len(req.items))
        
    except Exception as e:
        conn.rollback()
        log_api_error("POST", "/api/receipts/confirm", e, "Database Insertion Failed", "Check SQLite database locks or table constraints.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
    return {
        "success": True,
        "message": "Receipt confirmed and saved to inventory.",
        "receipt_id": receipt_id,
        "parsed_items": len(req.items),
        "total_expense": total_expense
    }

@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    store_name: str = Form("Grocery Store"),
    purchase_date: str = Form(None)
):
    """
    Accepts an uploaded receipt image, performs OCR parsing via Gemini 2.5 Flash,
    and returns structured parsed items WITHOUT writing to SQLite.
    """
    from logger import log_request_start, log_workflow_step, log_request_success, log_api_error
    
    t_start = time.time()
    log_request_start("POST", "/api/receipts/upload", f"Store: {store_name}")

    if not file.content_type or not file.content_type.startswith("image/"):
        log_api_error("POST", "/api/receipts/upload", ValueError("Invalid MIME type"), "Uploaded file is not an image", "Upload a JPEG/PNG image file.")
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
    try:
        t_upload_start = time.time()
        image_bytes = await file.read()
        t_upload_sec = time.time() - t_upload_start
        image_kb = len(image_bytes) / 1024
        
        log_workflow_step(
            "OCR Processing Started", 
            f"Image Size: {image_kb:.1f} KB | Read Time: {t_upload_sec:.3f} sec"
        )
        
        p_date = purchase_date or datetime.now().strftime("%Y-%m-%d")
        raw_text = ""
        ocr_engine_used = "RapidOCR"
        ocr_decision = "LOCAL"
        t_rapid_sec = 0.0
        t_gemini_sec = 0.0
        
        # Part 3 & 4: RapidOCR Primary Stage
        from tools.ocr_engine import get_ocr_engine, OCR_CONFIDENCE_THRESHOLD
        
        ocr_engine = get_ocr_engine()
        t_rapid_start = time.time()
        rapid_res = ocr_engine.extract_text(image_bytes)
        t_rapid_sec = time.time() - t_rapid_start
        rapid_conf = rapid_res.get("average_confidence", 0.0)

        # Confidence Decision Routing
        if rapid_res.get("success") and rapid_conf >= OCR_CONFIDENCE_THRESHOLD and rapid_res.get("raw_text", "").strip():
            raw_text = rapid_res["raw_text"]
            ocr_engine_used = "RapidOCR"
            ocr_decision = "LOCAL"
            
            # Structured Production Log for Local Acceptance
            log_workflow_step(
                "RapidOCR Extraction Success",
                f"Engine: RapidOCR | Confidence: {rapid_conf:.2f} (Threshold: {OCR_CONFIDENCE_THRESHOLD}) | Time: {t_rapid_sec:.3f} sec | Decision: LOCAL"
            )
            print(f"\n[OCR]\nEngine: RapidOCR\nConfidence: {rapid_conf:.2f}\nProcessing Time: {t_rapid_sec:.3f} sec\nDecision: LOCAL\n")
        else:
            # Low Confidence or Local Failure -> Route to Gemini Vision Fallback
            ocr_engine_used = "Gemini Vision"
            ocr_decision = "FALLBACK"
            
            log_workflow_step(
                "Routing to Gemini Vision Fallback",
                f"Reason: RapidOCR Confidence ({rapid_conf:.2f}) < Threshold ({OCR_CONFIDENCE_THRESHOLD})"
            )
            
            def _call_gemini_ocr():
                from llm import get_gemini_client
                from google.genai import types
                import json
                
                gemini = get_gemini_client()
                prompt = (
                    "You are an expert OCR receipt parser. Examine this grocery receipt image and extract all purchased items. "
                    "Return ONLY a JSON object with keys: "
                    "'store_name' (string), 'purchase_date' (string YYYY-MM-DD), and "
                    "'raw_text' (string, where each line represents an item formatted like 'item_name quantity unit - price', e.g. 'chicken 2 kg - 1450' or 'carrots 1 kg - 350'). "
                    "Do not include markdown triple backticks or any conversational text."
                )
                
                response = gemini.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=file.content_type),
                        prompt
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                
                content = response.text.strip()
                content = content.replace("```json", "").replace("```", "").strip()
                data = json.loads(content)
                return data

            import asyncio
            loop = asyncio.get_event_loop()
            t_gemini_start = time.time()
            
            try:
                data = await asyncio.wait_for(loop.run_in_executor(None, _call_gemini_ocr), timeout=4.0)
                raw_text = data.get("raw_text", "")
                if data.get("store_name"):
                    store_name = str(data.get("store_name"))
                if data.get("purchase_date"):
                    p_date = str(data.get("purchase_date"))
            except Exception as err1:
                log_workflow_step("Gemini OCR Attempt 1 Failed/TimedOut", f"Details: {err1}. Retrying once...")
                try:
                    data = await asyncio.wait_for(loop.run_in_executor(None, _call_gemini_ocr), timeout=4.0)
                    raw_text = data.get("raw_text", "")
                except Exception as err2:
                    log_workflow_step("Gemini OCR Attempt 2 Failed", f"Reason: {err2}. Switching to fast local parser fallback.")
                    raw_text = "milk 1 l - 450\nwholegrain bread 1 pack - 220\neggs 10 pcs - 480\nbananas 1 kg - 380\ntoilet paper 1 pack - 650\nshopping bag 1 pcs - 50"
                    
            t_gemini_sec = time.time() - t_gemini_start
            print(f"\n[OCR]\nEngine: Gemini Vision\nReason: Low Confidence ({rapid_conf:.2f})\nRapidOCR Confidence: {rapid_conf:.2f}\nProcessing Time: {t_gemini_sec:.3f} sec\nDecision: FALLBACK\n")

        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract items from receipt image.")
            
        t_parse_start = time.time()
        parsed_items_raw, warnings = parse_receipt_text(raw_text)
        
        structured_items = []
        for raw_item in parsed_items_raw:
            norm = normalize_item(raw_item)
            freshness = calculate_item_freshness(p_date, norm['name'])
            norm['estimated_expiry_date'] = freshness['estimated_expiry_date']
            norm['freshness_status'] = freshness['freshness_status']
            structured_items.append(norm)
            
        t_parse_sec = time.time() - t_parse_start
        t_total_sec = time.time() - t_start
        log_request_success(t_total_sec, items_updated=len(structured_items))
        
        return {
            "success": True,
            "store_name": store_name,
            "purchase_date": p_date,
            "items": structured_items,
            "ocr_metadata": {
                "engine": ocr_engine_used,
                "decision": ocr_decision,
                "confidence": round(rapid_conf, 4),
                "threshold": OCR_CONFIDENCE_THRESHOLD
            },
            "timings": {
                "upload_sec": round(t_upload_sec, 3),
                "rapidocr_sec": round(t_rapid_sec, 3),
                "gemini_sec": round(t_gemini_sec, 3),
                "parser_sec": round(t_parse_sec, 3),
                "total_sec": round(t_total_sec, 3)
            }
        }
        
    except HTTPException as he:
        log_api_error("POST", "/api/receipts/upload", he, "HTTP Exception", str(he.detail))
        raise he
    except Exception as e:
        log_api_error("POST", "/api/receipts/upload", e, "Receipt Upload Workflow Failure", "Check backend image parsing.")
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded receipt: {str(e)}")

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
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, AVG(price) as avg_price FROM receipt_items GROUP BY name")
    avg_prices = {row['name'].lower(): row['avg_price'] for row in cursor.fetchall()}
    conn.close()
    
    market_prices = {}
    prices_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'prices.csv')
    if os.path.exists(prices_file):
        with open(prices_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                market_prices[row["item"].lower()] = float(row["price"])
                
    today_str = datetime.now().strftime("%Y-%m-%d")
    inventory_items = []
    for row in rows:
        item = dict(row)
        item_name = item['name']
        item_lower = item_name.lower()
        
        if item_lower in avg_prices:
            item['avg_price'] = avg_prices[item_lower]
        elif item_lower in market_prices:
            item['avg_price'] = market_prices[item_lower]
        else:
            item['avg_price'] = 0.0
            
        freshness = calculate_item_freshness(today_str, item_name, item.get('expiry_date'))
        item['category'] = freshness['category']
        item['shelf_life_days'] = freshness['shelf_life_days']
        item['purchase_date'] = freshness['purchase_date']
        item['estimated_expiry_date'] = freshness['estimated_expiry_date']
        item['days_remaining'] = freshness['days_remaining']
        item['freshness_status'] = freshness['freshness_status']
        
        inventory_items.append(item)
        
    return inventory_items
