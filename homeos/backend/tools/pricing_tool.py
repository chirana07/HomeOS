# pricing_tool.py
import os
import csv
from .inventory_tool import get_inventory

def estimate_cost(meals, recipes_list=None):
    """
    Estimates the cost of missing ingredients from inventory and matches them with prices.csv.
    """
    # Read inventory
    inventory = get_inventory()["items"]
    inventory_names = {item["name"].lower() for item in inventory}
    
    # Read recipe ingredients
    recipes = {}
    if recipes_list:
        for r in recipes_list:
            recipes[r["recipe_name"].lower()] = [i.strip().lower() for i in r["ingredients"]]
    else:
        recipes_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'recipes.csv')
        if os.path.exists(recipes_file):
            with open(recipes_file, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    recipes[row["recipe_name"].lower()] = [i.strip().lower() for i in row["ingredients"].split(";")]
                
    # Read market prices
    prices_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'prices.csv')
    market_prices = {}
    if os.path.exists(prices_file):
        with open(prices_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                market_prices[row["item"].lower()] = {
                    "price": float(row["price"]),
                    "unit": row["unit"]
                }
                
    # Calculate what is missing
    missing_ingredients = []
    total_cost = 0.0
    
    # Let's count ingredients needed
    needed_ingredients = set()
    for meal in meals:
        if isinstance(meal, dict):
            meal_name = meal.get("meal_name", "")
        else:
            meal_name = meal
        ingredients = recipes.get(meal_name.lower(), [])
        for ing in ingredients:
            needed_ingredients.add(ing)
            
    # Check if they are in inventory
    for ing in needed_ingredients:
        if ing not in inventory_names:
            price_info = market_prices.get(ing, {"price": 0.0, "unit": ""})
            missing_ingredients.append(ing.capitalize())
            total_cost += price_info["price"]
            
    return {
        "total_cost": int(total_cost),
        "missing_ingredients": sorted(list(missing_ingredients))
    }

def save_meal_plan(plan):
    """
    Saves the generated meal plan JSON to data/meal_plan.json.
    """
    import json
    plan_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'meal_plan.json')
    os.makedirs(os.path.dirname(plan_file), exist_ok=True)
    with open(plan_file, 'w', encoding='utf-8') as f:
        json.dump(plan, f, indent=2)
    return {"status": "success", "message": "Meal plan saved."}

