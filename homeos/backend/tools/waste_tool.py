# waste_tool.py
from .db import get_db_connection

def get_waste_history():
    """
    Queries the SQLite database and returns the historical food waste records.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT item, waste_count, waste_score FROM waste_history")
    rows = cursor.fetchall()
    conn.close()
    
    waste_items = []
    for r in rows:
        waste_items.append({
            "item": r["item"],
            "waste_count": r["waste_count"],
            "waste_score": r["waste_score"]
        })
        
    return {"waste_items": waste_items}
