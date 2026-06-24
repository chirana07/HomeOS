# coordinator.py
import sys
import os

# Add parent path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from graph.state import AgentState
from tools.db import get_db_connection

def coordinator_agent(state: AgentState):
    """
    Coordinator Agent parses parameters, queries MealHistory to avoid repeats,
    and initializes state. (No LLM, Python Only)
    """
    budget = state.get("budget", 10000.0)
    family_size = state.get("family_size", 4)
    inventory = state.get("inventory", [])
    
    # Query meals consumed in the last 7 days from SQLite MealHistory table
    meal_history = []
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT breakfast, lunch, dinner FROM MealHistory ORDER BY id DESC LIMIT 7")
        rows = cursor.fetchall()
        conn.close()
        
        for r in rows:
            if r["breakfast"]:
                meal_history.append(r["breakfast"])
            if r["lunch"]:
                meal_history.append(r["lunch"])
            if r["dinner"]:
                meal_history.append(r["dinner"])
    except Exception as e:
        print(f"Error querying MealHistory in Coordinator: {e}")
        
    # Deduplicate list
    meal_history = list(set(meal_history))
    
    objective = (
        f"Optimize 3-day meal plan for a family of {family_size} within LKR {budget}. "
        f"Prioritize perishables, and avoid repeating meals: {', '.join(meal_history)}."
    )
    
    trace_entry = {
        "agent": "Coordinator Agent",
        "input": f"Budget: LKR {budget} | Family Size: {family_size} | Inventory: {inventory}",
        "decision": "Successfully parsed inputs and retrieved 7-day MealHistory.",
        "output": f"Goal state set. Objective: '{objective}'"
    }
    
    return {
        "budget": budget,
        "family_size": family_size,
        "inventory": inventory,
        "meal_history": meal_history,
        "agent_trace": [trace_entry]
    }
