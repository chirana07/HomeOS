import os
import json
import csv
import time
import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from graph.workflow import compiled_graph
from tools.db import get_db_connection
from logger import log_api_request, log_api_error

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

@router.get("/")
def get_current_plan():
    """
    Returns the currently persisted meal plan, including dynamically updated shopping lists.
    """
    plan = get_persisted_plan()
    if not plan:
        raise HTTPException(status_code=404, detail="No meal plan generated yet.")
        
    # Dynamically inject completion status for Dashboard
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT day, meal_type FROM MealExecution")
        completed_rows = cursor.fetchall()
        conn.close()
        
        # map (day, meal_type) -> True
        completed_set = {(r["day"], r["meal_type"].lower()) for r in completed_rows}
        
        if "daily_plan" in plan:
            for day_num in [1, 2, 3]:
                day_key = f"day_{day_num}"
                if day_key in plan["daily_plan"]:
                    for m_type in ["breakfast", "lunch", "dinner"]:
                        if m_type in plan["daily_plan"][day_key]:
                            if (day_num, m_type) in completed_set:
                                plan["daily_plan"][day_key][m_type]["status"] = "Completed"
                            else:
                                plan["daily_plan"][day_key][m_type]["status"] = "Pending"
    except Exception as e:
        print(f"Error injecting statuses: {e}")
        
    return plan

@router.post("/generate")
def generate_plan(req: GenerationRequest):
    """
    Executes the full autonomous LangGraph agent workflow.
    """
    if req.family_size <= 0:
        raise HTTPException(status_code=400, detail="family_size must be greater than 0")
    if req.budget <= 0:
        raise HTTPException(status_code=400, detail="budget must be greater than 0")
        
    # 1. Reset MealExecution on new generation (but keep depleted inventory)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM MealExecution")
        conn.commit()
        conn.close()
        print("Cleared previous meal execution records.")
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
    
    start_time = time.time()
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
                
                log_api_request(
                    method="POST",
                    route="/api/plan/generate",
                    steps=[
                        ("Inventory Loaded", f"{len(req.inventory)} items"),
                        ("LangGraph Agents Workflow", "Coordinator -> Inventory -> Waste -> Recipe -> Reflection -> Meal Plan"),
                        ("Plan Compilation", "Meal Plan compiled successfully")
                    ],
                    execution_time=time.time() - start_time,
                    status="SUCCESS"
                )
                return report
                
        raise HTTPException(status_code=500, detail="Reporting Agent failed to output final meal plan database.")
    except Exception as e:
        log_api_error("POST", "/api/plan/generate", e, "LangGraph execution or GEMINI_API_KEY connection failed")
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
    
    # Load market prices to calculate cost of depleted items
    prices_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'prices.csv')
    market_prices = {}
    if os.path.exists(prices_file):
        with open(prices_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                market_prices[row["item"].lower()] = float(row["price"])

    consumed_list = []
    deductions_list = []
    remaining_list = []
    newly_depleted = []
    
    # 4. Reduce quantities in SQLite Inventory table
    for ing_name, base_qty in ingredients_json.items():
        db_ing = normalize_ingredient_name(ing_name)
        deduction = base_qty * family_size if portion_per_person else base_qty
        
        cursor.execute("SELECT quantity, original_quantity, unit FROM Inventory WHERE LOWER(ingredient) = ?", (db_ing,))
        row = cursor.fetchone()
        if row:
            current_qty = float(row["quantity"])
            try:
                original_qty = float(row["original_quantity"]) if row["original_quantity"] is not None else current_qty
            except (ValueError, TypeError):
                original_qty = current_qty
                
            unit = row["unit"]
            new_qty = max(0.0, current_qty - deduction)
            cursor.execute("UPDATE Inventory SET quantity = ? WHERE LOWER(ingredient) = ?", (new_qty, db_ing))
            
            # Add to shopping list if it drops to 20% or less of original capacity
            threshold = original_qty * 0.2
            if new_qty <= threshold and current_qty > threshold:
                cost = market_prices.get(db_ing, 100.0)
                newly_depleted.append({
                    "item": db_ing.capitalize(),
                    "qty": f"1 {unit}", 
                    "cost": int(cost),
                    "priority": "high" if new_qty == 0.0 else "medium"
                })
            
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
    
    # Append newly depleted items to shopping list
    if newly_depleted:
        if "shopping_list" not in plan:
            plan["shopping_list"] = []
            
        existing_items = {item["item"].lower() for item in plan["shopping_list"]}
        
        for new_item in newly_depleted:
            if new_item["item"].lower() not in existing_items:
                plan["shopping_list"].append(new_item)
    
    # Save plan back to disk
    plan_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'meal_plan.json')
    with open(plan_file, 'w', encoding='utf-8') as f:
        json.dump(plan, f, indent=2)
        
    return {
        "status": "success",
        "message": f"Meal completion recorded and inventory updated for {recipe_name}.",
        "trace_entry": trace_entry
    }

@router.post("/undo-meal")
def undo_meal(req: CompleteMealRequest):
    """
    Undoes a completed meal, restores inventory, and removes the trace.
    """
    if req.day not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Day must be 1, 2, or 3.")
    m_type = req.meal_type.lower()
    if m_type not in ["breakfast", "lunch", "dinner"]:
        raise HTTPException(status_code=400, detail="Meal type must be breakfast, lunch, or dinner.")
        
    plan = get_persisted_plan()
    if not plan or "daily_plan" not in plan:
        raise HTTPException(status_code=400, detail="No meal plan exists.")
        
    day_key = f"day_{req.day}"
    daily_plan = plan["daily_plan"]
    if day_key not in daily_plan:
        raise HTTPException(status_code=404, detail=f"Day {req.day} not found in the current plan.")
        
    meal = daily_plan[day_key].get(m_type)
    if not meal:
        raise HTTPException(status_code=404, detail=f"Meal type {req.meal_type} not found on Day {req.day}.")
        
    recipe_name = meal.get("meal_name", "")
    
    # 1. Ensure it was actually completed
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM MealExecution WHERE day = ? AND meal_type = ?", (req.day, m_type))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Meal is not currently completed.")
        
    # 2. Get recipe ingredients to restore
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
                    
    if not ingredients_json:
        ingredients_json = {i.lower(): 1.0 for i in meal.get("ingredients_used", [])}
        portion_per_person = True
        
    family_size = plan.get("household_economics", {}).get("family_size", 4)
    
    # 3. Restore inventory quantities
    try:
        for ing_name, base_qty in ingredients_json.items():
            db_ing = normalize_ingredient_name(ing_name)
            addition = base_qty * family_size if portion_per_person else base_qty
            
            cursor.execute("SELECT quantity FROM Inventory WHERE LOWER(ingredient) = ?", (db_ing,))
            row = cursor.fetchone()
            if row:
                new_qty = float(row["quantity"]) + addition
                cursor.execute("UPDATE Inventory SET quantity = ? WHERE LOWER(ingredient) = ?", (new_qty, db_ing))
                
        # 4. Delete the MealExecution record
        cursor.execute("DELETE FROM MealExecution WHERE day = ? AND meal_type = ?", (req.day, m_type))
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Database undo failed: {e}")
    finally:
        try:
            conn.close()
        except:
            pass
            
    # 5. Remove the exact trace entry
    trace_input_match = f"Meal Completed: Day {req.day} {req.meal_type.capitalize()} ({recipe_name})"
    if "agent_reasoning" in plan and "agent_trace" in plan["agent_reasoning"]:
        original_trace = plan["agent_reasoning"]["agent_trace"]
        # Filter out the matching trace log (keep all others)
        plan["agent_reasoning"]["agent_trace"] = [t for t in original_trace if t.get("input") != trace_input_match]
        
    # Save plan back to disk
    plan_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'meal_plan.json')
    with open(plan_file, 'w', encoding='utf-8') as f:
        json.dump(plan, f, indent=2)
        
    return {
        "status": "success",
        "message": f"Meal completion undone and inventory restored for {recipe_name}."
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
            try:
                oq = float(r["original_quantity"])
                cq = float(r["quantity"])
            except (ValueError, TypeError):
                oq, cq = 0.0, 0.0
            consumed = max(0.0, oq - cq)
            items.append({
                "ingredient": r["ingredient"].capitalize(),
                "quantity": cq,
                "original_quantity": oq,
                "consumed": consumed,
                "unit": r["unit"],
                "expiry_date": r["expiry_date"]
            })
        return {"inventory": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query inventory: {e}")
