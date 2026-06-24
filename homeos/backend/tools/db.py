# db.py
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'homeos.db')

def get_db_connection():
    """
    Establishes and returns a connection to the local SQLite database.
    """
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initializes the SQLite tables for Inventory, MealExecution, waste history, and meal history and seeds them if empty.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Drop old inventory table if it exists to prevent conflict and migration issues
    cursor.execute("DROP TABLE IF EXISTS inventory")
    cursor.execute("DROP TABLE IF EXISTS Inventory")
    
    # Create new Inventory table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ingredient TEXT NOT NULL UNIQUE,
            quantity REAL NOT NULL,
            original_quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            expiry_date TEXT
        )
    """)
    
    # Create MealExecution table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS MealExecution (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day INTEGER NOT NULL,
            meal_type TEXT NOT NULL,
            recipe_name TEXT NOT NULL,
            completed_at TEXT NOT NULL,
            UNIQUE(day, meal_type)
        )
    """)
    
    # Create waste_history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS waste_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL UNIQUE,
            waste_count TEXT NOT NULL,
            waste_score TEXT NOT NULL
        )
    """)
    
    # Create MealHistory table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS MealHistory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            breakfast TEXT NOT NULL,
            lunch TEXT NOT NULL,
            dinner TEXT NOT NULL
        )
    """)
    
    # Create receipts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_date TEXT NOT NULL,
            store_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create receipt_items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS receipt_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            quantity TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY(receipt_id) REFERENCES receipts(id)
        )
    """)
    
    # Create monthly_expenses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS monthly_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month_year TEXT NOT NULL UNIQUE,
            total_expense REAL NOT NULL
        )
    """)
    
    conn.commit()
    
    # Seed Inventory (all in lowercase to facilitate match, capitalizing in response if needed)
    cursor.execute("SELECT COUNT(*) FROM Inventory")
    if cursor.fetchone()[0] == 0:
        seed_inventory = [
            ("rice", 5000.0, 5000.0, "g", "2026-07-20"),
            ("carrots", 1000.0, 1000.0, "g", "2026-06-23"),
            ("eggs", 24.0, 24.0, "pcs", "2026-06-30"),
            ("soy sauce", 500.0, 500.0, "ml", "2026-12-20"),
            ("cooking oil", 1000.0, 1000.0, "ml", "2026-12-20"),
            ("onions", 500.0, 500.0, "g", "2026-07-10"),
            ("garlic", 100.0, 100.0, "g", "2026-07-10"),
            ("chicken", 2000.0, 2000.0, "g", "2026-06-25"),
            ("tomatoes", 500.0, 500.0, "g", "2026-06-25"),
            ("beans", 500.0, 500.0, "g", "2026-06-28")
        ]
        cursor.executemany("""
            INSERT OR IGNORE INTO Inventory (ingredient, quantity, original_quantity, unit, expiry_date)
            VALUES (?, ?, ?, ?, ?)
        """, seed_inventory)
        conn.commit()
        
    # Seed waste history
    cursor.execute("SELECT COUNT(*) FROM waste_history")
    if cursor.fetchone()[0] == 0:
        seed_waste = [
            ("Carrots", "4", "0.8"),
            ("Eggs", "2", "0.5"),
            ("Rice", "1", "0.2"),
            ("Soy Sauce", "0", "0.1")
        ]
        cursor.executemany("""
            INSERT OR IGNORE INTO waste_history (item, waste_count, waste_score)
            VALUES (?, ?, ?)
        """, seed_waste)
        conn.commit()

    # Seed MealHistory with past 7 days of meals (dates 2026-06-13 to 2026-06-19)
    cursor.execute("SELECT COUNT(*) FROM MealHistory")
    if cursor.fetchone()[0] == 0:
        seed_history = [
            ("2026-06-13", "Egg Rice Bowl", "Chicken Fried Rice", "Soy Glazed Chicken"),
            ("2026-06-14", "Scrambled Eggs on Rice", "Carrot Ginger Soup", "Braised Chicken with Carrots"),
            ("2026-06-15", "Boiled Eggs with Rice", "Green Beans Stir Fry", "Chicken Fried Rice"),
            ("2026-06-16", "Garlic Rice", "Egg and Tomato Stir Fry", "Chicken and Beans Stir Fry"),
            ("2026-06-17", "Onion and Egg Omelet", "Tomato Egg Soup", "Chicken and Rice"),
            ("2026-06-18", "Steamed Rice", "Carrot Salad", "Braised Chicken with Carrots"),
            ("2026-06-19", "Scrambled Eggs on Rice", "Vegetable Rice", "Mixed Rice Bowl")
        ]
        cursor.executemany("""
            INSERT OR IGNORE INTO MealHistory (date, breakfast, lunch, dinner)
            VALUES (?, ?, ?, ?)
        """, seed_history)
        conn.commit()
        
    conn.close()
    print("Local SQLite database initialized and seeded with Inventory.")
