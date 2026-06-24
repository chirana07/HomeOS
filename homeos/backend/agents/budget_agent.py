# budget_agent.py
import os
import sys
import csv
from graph.state import AgentState

# Add parent path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.pricing_tool import estimate_cost

def budget_agent(state: AgentState):
    """
    Budget Agent calculates costs, missing ingredients, and the shopping list. (No LLM, Python Only)
    """
    prompt_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    weekly_plan = state.get("weekly_plan", {})
    inventory = state.get("inventory", [])
    inventory_names = {item["name"].lower() for item in inventory}
    
    # Load prices
    prices_file = os.path.join(prompt_dir, 'data', 'prices.csv')
    market_prices = {}
    if os.path.exists(prices_file):
        with open(prices_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                market_prices[row["item"].lower()] = {
                    "price": float(row["price"]),
                    "qty": row["unit"]
                }
                
    # Load recipes ingredients map
    recipes_file = os.path.join(prompt_dir, 'data', 'recipes.csv')
    recipes = {}
    if os.path.exists(recipes_file):
        with open(recipes_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                recipes[row["recipe_name"].lower()] = [i.strip().lower() for i in row["ingredients"].split(";")]
                
    missing_set = set()
    updated_plan = {}
    
    # Calculate costs for individual meals in weekly_plan
    for day_key, meals in weekly_plan.items():
        updated_plan[day_key] = {}
        for meal_type in ["breakfast", "lunch", "dinner"]:
            meal = meals[meal_type]
            meal_name = meal["meal_name"]
            
            # Check what is missing
            meal_ingredients = recipes.get(meal_name.lower(), [])
            meal_missing = [ing for ing in meal_ingredients if ing not in inventory_names]
            
            # Calculate cost
            meal_cost = 0.0
            for ing in meal_missing:
                missing_set.add(ing)
                meal_cost += market_prices.get(ing, {"price": 0.0})["price"]
                
            # Update meal costs and consumed items
            meal_copy = dict(meal)
            meal_copy["cost_estimate"] = int(meal_cost)
            meal_copy["inventory_consumed"] = [i.capitalize() for i in meal_ingredients if i in inventory_names]
            
            # Determine waste prevented
            urgent_set = {u.lower() for u in state.get("urgent_foods", [])}
            meal_copy["waste_prevented"] = [i.capitalize() for i in meal_ingredients if i in urgent_set]
            
            updated_plan[day_key][meal_type] = meal_copy

    # Construct the shopping list
    shopping_list = []
    total_cost = 0.0
    
    for ing in sorted(list(missing_set)):
        price_info = market_prices.get(ing, {"price": 100.0, "qty": "1 unit"})
        cost = price_info["price"]
        total_cost += cost
        
        priority = "medium"
        if ing in ["cooking oil", "onions", "garlic"]:
            priority = "high"
        elif ing in ["chicken"]:
            priority = "medium"
        else:
            priority = "low"
            
        shopping_list.append({
            "item": ing.capitalize(),
            "qty": price_info["qty"],
            "cost": int(cost),
            "priority": priority
        })

    trace_entry = {
        "agent": "Budget Agent",
        "input": f"Allowed budget limit: LKR {state.get('budget')} | Weekly Plan days: {len(weekly_plan)}",
        "decision": "Calculated costs for all 3 days programmatically from prices.csv.",
        "output": f"Total Cost: LKR {int(total_cost)} | Shopping list size: {len(shopping_list)}"
    }

    return {
        "weekly_plan": updated_plan,
        "shopping_list": shopping_list,
        "estimated_cost": total_cost,
        "agent_trace": [trace_entry]
    }
