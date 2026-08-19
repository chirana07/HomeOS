# db.py
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'homeos.db')

def get_db_connection():
    """
    Establishes and returns a connection to the local SQLite database.
    """
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
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
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create user_preferences table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY,
            currency TEXT DEFAULT 'LKR',
            dietary_preferences TEXT DEFAULT '[]',
            household_size INTEGER DEFAULT 4,
            monthly_budget REAL DEFAULT 15000.0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    # Seed default commercial admin user
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        from tools.security import hash_password
        admin_pass = hash_password("password123")
        cursor.execute("INSERT INTO users (email, full_name, hashed_password) VALUES (?, ?, ?)",
                       ("admin@homeos.ai", "Commercial Admin", admin_pass))
        admin_id = cursor.lastrowid
        cursor.execute("INSERT INTO user_preferences (user_id, currency, dietary_preferences, household_size, monthly_budget) VALUES (?, ?, ?, ?, ?)",
                       (admin_id, "LKR", '["Halal"]', 4, 15000.0))
        conn.commit()
    
    # Create monthly_expenses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS monthly_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month_year TEXT NOT NULL UNIQUE,
            total_expense REAL NOT NULL
        )
    """)
    
    conn.commit()
    
    # Seed Inventory (40 canonical items with realistic stock levels and relative expiries)
    cursor.execute("SELECT COUNT(*) FROM Inventory")
    if cursor.fetchone()[0] == 0:
        seed_inventory = [
            ("rice", 4250.0, 5000.0, "g", "2026-10-15"),
            ("red rice", 3000.0, 5000.0, "g", "2026-11-20"),
            ("flour", 1500.0, 2000.0, "g", "2026-09-30"),
            ("noodles", 400.0, 800.0, "g", "2026-10-10"),
            ("chicken", 700.0, 2000.0, "g", "2026-07-31"),
            ("eggs", 6.0, 24.0, "pcs", "2026-08-03"),
            ("fish", 400.0, 750.0, "g", "2026-07-31"),
            ("lentils", 500.0, 1000.0, "g", "2026-11-15"),
            ("chickpeas", 600.0, 1000.0, "g", "2026-12-01"),
            ("milk", 250.0, 1000.0, "ml", "2026-07-29"),
            ("cheese", 40.0, 500.0, "g", "2026-08-08"),
            ("butter", 75.0, 250.0, "g", "2026-08-20"),
            ("yogurt", 160.0, 400.0, "g", "2026-07-30"),
            ("onions", 90.0, 500.0, "g", "2026-08-05"),
            ("tomatoes", 110.0, 500.0, "g", "2026-07-30"),
            ("potatoes", 700.0, 1000.0, "g", "2026-08-15"),
            ("carrots", 150.0, 1000.0, "g", "2026-08-03"),
            ("beans", 300.0, 500.0, "g", "2026-08-02"),
            ("cabbage", 400.0, 600.0, "g", "2026-08-04"),
            ("spinach", 60.0, 200.0, "g", "2026-07-29"),
            ("garlic", 5.0, 150.0, "g", "2026-08-10"),
            ("ginger", 70.0, 150.0, "g", "2026-08-12"),
            ("banana", 600.0, 1000.0, "g", "2026-08-01"),
            ("apple", 4.0, 6.0, "pcs", "2026-08-06"),
            ("orange", 4.0, 6.0, "pcs", "2026-08-07"),
            ("papaya", 600.0, 1000.0, "g", "2026-08-02"),
            ("sugar", 1600.0, 2000.0, "g", "2027-01-01"),
            ("salt", 450.0, 500.0, "g", "2027-06-01"),
            ("tea", 200.0, 250.0, "g", "2026-12-15"),
            ("coffee", 150.0, 250.0, "g", "2026-12-01"),
            ("coconut milk", 400.0, 600.0, "ml", "2026-08-25"),
            ("cooking oil", 50.0, 1000.0, "ml", "2026-12-20"),
            ("pepper", 80.0, 100.0, "g", "2026-12-31"),
            ("curry powder", 120.0, 200.0, "g", "2026-11-30"),
            ("chili powder", 140.0, 200.0, "g", "2026-11-30"),
            ("cinnamon", 40.0, 50.0, "g", "2026-12-31"),
            ("soy sauce", 350.0, 500.0, "ml", "2026-12-20"),
            ("frozen peas", 300.0, 500.0, "g", "2026-10-31"),
            ("frozen chicken nuggets", 350.0, 500.0, "g", "2026-09-30"),
            ("biscuits", 2.0, 4.0, "pack", "2026-09-15")
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
            ("Milk", "3", "0.7"),
            ("Tomatoes", "4", "0.8"),
            ("Spinach", "2", "0.5"),
            ("Carrots", "1", "0.2"),
            ("Soy Sauce", "0", "0.1")
        ]
        cursor.executemany("""
            INSERT OR IGNORE INTO waste_history (item, waste_count, waste_score)
            VALUES (?, ?, ?)
        """, seed_waste)
        conn.commit()

    # Seed monthly expenses (Feb 2026 to Jul 2026)
    seed_expenses = [
        ("2026-02", 8450.00),
        ("2026-03", 9120.00),
        ("2026-04", 9800.00),
        ("2026-05", 8950.00),
        ("2026-06", 10800.25),
        ("2026-07", 9450.00)
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO monthly_expenses (month_year, total_expense)
        VALUES (?, ?)
    """, seed_expenses)
    conn.commit()

    # Seed MealExecution with recent meals
    cursor.execute("SELECT COUNT(*) FROM MealExecution")
    if cursor.fetchone()[0] == 0:
        seed_exec = [
            (1, "breakfast", "Pol Roti with Coconut Sambol", "2026-07-27 08:15:00"),
            (1, "lunch", "Sri Lankan Dhal Curry", "2026-07-27 13:00:00"),
            (1, "dinner", "Sri Lankan Chicken Curry", "2026-07-27 20:00:00"),
            (2, "breakfast", "Egg Hopper Breakfast Feast", "2026-07-28 08:30:00"),
            (2, "lunch", "Red Rice with Dhal & Cabbage Mallum", "2026-07-28 13:15:00"),
            (2, "dinner", "Devilled Chicken Stir Fry", "2026-07-28 20:30:00"),
            (3, "breakfast", "Classic French Toast with Sugar", "2026-07-29 08:00:00"),
            (3, "lunch", "Chicken Fried Rice", "2026-07-29 13:30:00")
        ]
        cursor.executemany("""
            INSERT OR IGNORE INTO MealExecution (day, meal_type, recipe_name, completed_at)
            VALUES (?, ?, ?, ?)
        """, seed_exec)
        conn.commit()

    conn.close()
    print("Local SQLite database initialized and seeded with 40 inventory items and multi-month telemetry.")
