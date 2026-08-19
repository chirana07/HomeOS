# waste_agent.py
import os
import sys
from graph.state import AgentState

# Add parent path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.waste_tool import get_waste_history

def waste_agent(state: AgentState):
    """
    Waste Agent reads waste history from SQLite and maps waste risk. (No LLM, Python Only)
    """
    history = get_waste_history().get("waste_items", [])
    history_map = {w["item"].lower(): w for w in history}
    
    inventory = state.get("inventory", [])
    waste_risk = []
    
    for item in inventory:
        if isinstance(item, str):
            name = item
        elif isinstance(item, dict):
            name = item.get("ingredient") or item.get("name") or ""
        else:
            name = str(item)

        name_lower = name.lower().strip()
        if not name_lower:
            continue

        if name_lower in history_map:
            record = history_map[name_lower]
            score = float(record["waste_score"])
            
            level = "low"
            if score >= 0.7:
                level = "high"
            elif score >= 0.4:
                level = "medium"
                
            waste_risk.append({
                "item": name,
                "waste_score": score,
                "level": level,
                "reason": f"Perishable · Score {score}"
            })
            
    # Sort waste risk descending
    waste_risk.sort(key=lambda x: x["waste_score"], reverse=True)
    
    inventory_names_list = []
    for item in inventory:
        if isinstance(item, str):
            inventory_names_list.append(item)
        elif isinstance(item, dict):
            inventory_names_list.append(item.get("ingredient") or item.get("name") or "")

    trace_entry = {
        "agent": "Waste Agent",
        "input": f"Pantry stock items: {inventory_names_list}",
        "decision": "Successfully calculated waste risk from SQLite history tables.",
        "output": f"Waste risk rankings: {waste_risk}"
    }
    
    return {
        "waste_risk": waste_risk,
        "agent_trace": [trace_entry]
    }
