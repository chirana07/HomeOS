# inventory_agent.py
import os
import sys
from graph.state import AgentState

# Add parent path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.inventory_tool import get_inventory

def inventory_agent(state: AgentState):
    """
    Inventory Agent resolves stock metadata and tags expiring items. (No LLM, Python Only)
    """
    db_inventory = get_inventory().get("items", [])
    db_inventory_map = {item["name"].lower(): item for item in db_inventory}
    
    user_inv = state.get("inventory", [])
    if isinstance(user_inv, str):
        user_inv = [i.strip() for i in user_inv.replace("\n", ",").split(",") if i.strip()]
        
    resolved_inventory = []
    urgent_foods = []
    
    for item in user_inv:
        if isinstance(item, dict):
            name = item.get("ingredient") or item.get("name") or ""
        elif isinstance(item, str):
            name = item
        else:
            name = str(item)
            
        name_lower = name.lower().strip()
        if not name_lower:
            continue

        if name_lower in db_inventory_map:
            meta = db_inventory_map[name_lower]
            resolved_inventory.append(meta)
            # Tag urgent perishables (e.g. carrots, milk, tomatoes, chicken, spinach)
            if any(k in name_lower for k in ["carrots", "milk", "tomatoes", "spinach", "chicken"]):
                urgent_foods.append(meta["name"])
        else:
            fallback_meta = {"name": name, "quantity": "1", "unit": "unit", "expiry_date": "2026-08-25"}
            resolved_inventory.append(fallback_meta)
            
    trace_entry = {
        "agent": "Inventory Agent",
        "input": f"User Inventory List: {user_inv}",
        "decision": f"Matched items against SQLite pantry DB. Flagged {len(urgent_foods)} urgent item(s).",
        "output": f"Urgent foods: {urgent_foods} | Resolved items: {resolved_inventory}"
    }
    
    return {
        "inventory": resolved_inventory,
        "urgent_foods": urgent_foods,
        "agent_trace": [trace_entry]
    }
