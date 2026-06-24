# plan.py
import os
import json
import csv
import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from graph.workflow import compiled_graph
from tools.db import get_db_connection

router = APIRouter()

class GenerationRequest(BaseModel):
    budget: float
    family_size: int
    inventory: List[str]

# Global variable fallback memory for trace and plan
_last_plan = None

def get_persisted_plan():
    """
    Helper to read the plan from data/meal_plan.json
    """
    global _last_plan
    plan_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'meal_plan.json')
    if os.path.exists(plan_file):
        try:
            with open(plan_file, 'r', encoding='utf-8') as f:
                _last_plan = json.load(f)
                return _last_plan
        except Exception:
            pass
    return _last_plan

@router.post("/generate")
def generate_plan(req: GenerationRequest):
    """
    Executes the full autonomous LangGraph agent workflow.
    """
    # 1. Reset MealExecution and restore Inventory quantities on new generation
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM MealExecution")
        cursor.execute("UPDATE Inventory SET quantity = original_quantity")
        conn.commit()
        conn.close()
        print("Cleared previous meal execution records and restored inventory stock.")
    except Exception as e:
        print(f"Error resetting database state: {e}")
        
    initial_state = {
        "budget": req.budget,
        "family_size": req.family_size,
        "inventory": req.inventory,
        "urgent_foods": [],
        "waste_risk": [],
        "recipes": [],
        "meal_history": [],
        "weekly_plan": {},
        "shopping_list": [],
        "estimated_cost": 0.0,
        "reasoning_summary": "",
        "reflection_result": {},
        "retry_count": 0,
        "agent_trace": []
    }
    
    try:
        # Run LangGraph compilation synchronously
        final_state = compiled_graph.invoke(initial_state)
        
        # Load output report compiled by Reporting Agent
        report_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'meal_plan.json')
        if os.path.exists(report_file):
            with open(report_file, 'r', encoding='utf-8') as f:
                report = json.load(f)
                global _last_plan
                _last_plan = report
                return report
                
        raise HTTPException(status_code=500, detail="Reporting Agent failed to output final meal plan database.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph execution failed: {e}")

@router.get("/trace")
def get_trace():
    """
    Retrieves the execution trace logs from the last run.
    """
    plan = get_persisted_plan()
    if plan and "agent_reasoning" in plan:
        return {"trace": plan["agent_reasoning"].get("agent_trace", [])}
    return {"trace": []}

@router.get("/day/{id}")
def get_day_detail(id: int):
    """
    Retrieves details for a specific day of the week (Day 1 through Day 3) with completion status.
    """
    plan = get_persisted_plan()
    if not plan or "daily_plan" not in plan:
        raise HTTPException(status_code=404, detail="No meal plan exists. Please generate a plan first.")
        
    day_key = f"day_{id}"
    daily_plan = plan["daily_plan"]
    if day_key not in daily_plan:
        raise HTTPException(status_code=404, detail=f"Day {id} does not exist in current weekly plan.")
        
    meals = daily_plan[day_key]
    
    # Query MealExecution table to fetch completed status dynamically
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT meal_type, completed_at FROM MealExecution WHERE day = ?", (id,))
        completed_rows = cursor.fetchall()
        conn.close()
        completed_meals = {r["meal_type"].lower(): r["completed_at"] for r in completed_rows}
    except Exception as e:
        print(f"Error querying MealExecution table: {e}")
        completed_meals = {}
        
    augmented_meals = {}
    for m_type in ["breakfast", "lunch", "dinner"]:
        if m_type in meals:
            m_data = dict(meals[m_type])
            if m_type in completed_meals:
                m_data["status"] = "Completed"
                m_data["completed_at"] = completed_meals[m_type]
            else:
                m_data["status"] = "Pending"
            augmented_meals[m_type] = m_data
            
    return {
        "day": id,
        "meals": augmented_meals,
        "household_economics": plan.get("household_economics", {})
    }

def normalize_ingredient_name(name: str) -> str:
    name = name.lower().strip()
    if name == "egg":
        return "eggs"
    if name == "carrot":
        return "carrots"
    if name == "tomato":
        return "tomatoes"
    if name == "bean":
        return "beans"
    if name == "onion":
        return "onions"
    return name

class CompleteMealRequest(BaseModel):
    day: int
    meal_type: str

@router.post("/complete-meal")
def complete_meal(req: CompleteMealRequest):
    """
    Records a completed meal, reduces inventory, and updates the agent trace.
    """
    if req.day not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Day must be 1, 2, or 3.")
    m_type = req.meal_type.lower()
    if m_type not in ["breakfast", "lunch", "dinner"]:
        raise HTTPException(status_code=400, detail="Meal type must be breakfast, lunch, or dinner.")
        
    plan = get_persisted_plan()
    if not plan or "daily_plan" not in plan:
        raise HTTPException(status_code=400, detail="No meal plan exists. Please generate a plan first.")
        
    day_key = f"day_{req.day}"
    daily_plan = plan["daily_plan"]
    if day_key not in daily_plan:
        raise HTTPException(status_code=404, detail=f"Day {req.day} not found in the current plan.")
        
    meal = daily_plan[day_key].get(m_type)
    if not meal:
        raise HTTPException(status_code=404, detail=f"Meal type {req.meal_type} not found on Day {req.day}.")
        
    recipe_name = meal.get("meal_name", "")
    
    # 1. Establish connection and check for existing completion
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM MealExecution WHERE day = ? AND meal_type = ?", (req.day, m_type))
    if cursor.fetchone():
        conn.close()
        return {"status": "success", "message": "Meal already completed."}
        
    # 2. Load recipe ingredients details from recipes.csv
    recipes_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'recipes.csv')
    ingredients_json = {}
    portion_per_person = True
    
    if os.path.exists(recipes_file):
        with open(recipes_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("recipe_name", "").lower() == recipe_name.lower():
                    ingredients_json = json.loads(row.get("ingredients_json", "{}"))
                    portion_per_person = row.get("portion_per_person", "true").lower() == "true"
                    break
                    
    # Fallback if recipe not found in CSV
    if not ingredients_json:
        ingredients_json = {i.lower(): 1.0 for i in meal.get("ingredients_used", [])}
        portion_per_person = True
        
    # 3. Multiply ingredients by family_size
    family_size = plan.get("household_economics", {}).get("family_size", 4)
    
    consumed_list = []
    deductions_list = []
    remaining_list = []
    
    # 4. Reduce quantities in SQLite Inventory table
    for ing_name, base_qty in ingredients_json.items():
        db_ing = normalize_ingredient_name(ing_name)
        deduction = base_qty * family_size if portion_per_person else base_qty
        
        cursor.execute("SELECT quantity, unit FROM Inventory WHERE LOWER(ingredient) = ?", (db_ing,))
        row = cursor.fetchone()
        if row:
            current_qty = row["quantity"]
            unit = row["unit"]
            new_qty = max(0.0, current_qty - deduction)
            cursor.execute("UPDATE Inventory SET quantity = ? WHERE LOWER(ingredient) = ?", (new_qty, db_ing))
            
            consumed_list.append(db_ing.capitalize())
            deductions_list.append(f"{deduction} {unit}")
            remaining_list.append(f"{db_ing.capitalize()}: {new_qty} {unit}")
        else:
            consumed_list.append(ing_name.capitalize())
            deductions_list.append(f"{deduction} unit")
            remaining_list.append(f"{ing_name.capitalize()}: 0 unit")
            
    # 5. Save execution entry using strict INSERT to raise IntegrityError on duplicate
    try:
        cursor.execute("""
            INSERT INTO MealExecution (day, meal_type, recipe_name, completed_at)
            VALUES (?, ?, ?, datetime('now'))
        """, (req.day, m_type, recipe_name))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        conn.close()
        return {"status": "success", "message": "Meal already completed (transaction rolled back)."}
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Database execution failed: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass
    
    # 6. Append new trace entry for Inventory Update Agent
    trace_entry = {
        "agent": "Inventory Update Agent",
        "input": f"Meal Completed: Day {req.day} {req.meal_type.capitalize()} ({recipe_name})",
        "decision": f"Deducted recipe ingredients scaled for family size {family_size} (portion_per_person: {portion_per_person}).",
        "output": f"Consumed: {', '.join(consumed_list)} | Deducted: {', '.join(deductions_list)} | Remaining: {', '.join(remaining_list)}"
    }
    
    if "agent_reasoning" not in plan:
        plan["agent_reasoning"] = {"agent_trace": []}
    if "agent_trace" not in plan["agent_reasoning"]:
        plan["agent_reasoning"]["agent_trace"] = []
        
    plan["agent_reasoning"]["agent_trace"].append(trace_entry)
    
    # Save plan back to disk
    plan_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'meal_plan.json')
    with open(plan_file, 'w', encoding='utf-8') as f:
        json.dump(plan, f, indent=2)
        
    return {
        "status": "success",
        "message": f"Meal completion recorded and inventory updated for {recipe_name}.",
        "trace_entry": trace_entry
    }

@router.get("/inventory")
def get_inventory_api():
    """
    Exposes the current stock levels and consumed totals for the dashboard.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ingredient, quantity, original_quantity, unit, expiry_date FROM Inventory")
        rows = cursor.fetchall()
        conn.close()
        
        items = []
        for r in rows:
            consumed = max(0.0, r["original_quantity"] - r["quantity"])
            items.append({
                "ingredient": r["ingredient"].capitalize(),
                "quantity": r["quantity"],
                "original_quantity": r["original_quantity"],
                "consumed": consumed,
                "unit": r["unit"],
                "expiry_date": r["expiry_date"]
            })
        return {"inventory": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query inventory: {e}")
