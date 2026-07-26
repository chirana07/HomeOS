// mockData.ts

export const MOCK_PLAN = {
  "daily_plan": {
    "day_1": {
      "breakfast": {
        "meal_name": "Braised Chicken with Carrots",
        "ingredients_used": ["Chicken", "Carrots", "Soy Sauce", "Onions", "Garlic", "Cooking Oil"],
        "recipe_summary": "Slow-braised chicken and tender carrots in a rich garlic-soy gravy.",
        "nutrition_score": 86,
        "cost_estimate": 0,
        "inventory_consumed": ["Chicken", "Carrots", "Soy sauce", "Onions", "Garlic", "Cooking oil"],
        "waste_prevented": ["Carrots"],
        "status": "Completed"
      },
      "lunch": {
        "meal_name": "Vegetable Rice",
        "ingredients_used": ["Rice", "Carrots", "Eggs"],
        "recipe_summary": "One-pot rice cooked with diced fresh carrots and scrambled egg ribbons.",
        "nutrition_score": 78,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Carrots", "Eggs"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      },
      "dinner": {
        "meal_name": "Carrot Stir Fry",
        "ingredients_used": ["Rice", "Carrots", "Eggs", "Cooking Oil"],
        "recipe_summary": "Sautéed carrot ribbons with scrambled egg ribbons served over warm rice.",
        "nutrition_score": 80,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Carrots", "Eggs", "Cooking oil"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      }
    },
    "day_2": {
      "breakfast": {
        "meal_name": "Vegetable Rice",
        "ingredients_used": ["Rice", "Carrots", "Eggs"],
        "recipe_summary": "One-pot rice cooked with diced fresh carrots and scrambled egg ribbons.",
        "nutrition_score": 78,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Carrots", "Eggs"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      },
      "lunch": {
        "meal_name": "Mixed Rice Bowl",
        "ingredients_used": ["Rice", "Carrots", "Eggs", "Soy Sauce"],
        "recipe_summary": "Steamed rice bowl topped with seasoned eggs and a splash of soy sauce.",
        "nutrition_score": 84,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Carrots", "Eggs", "Soy sauce"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      },
      "dinner": {
        "meal_name": "Vegetable Fried Rice",
        "ingredients_used": ["Rice", "Carrots", "Eggs", "Soy Sauce", "Cooking Oil"],
        "recipe_summary": "Wok-fried rice with sweet carrots, eggs, onions, and garlic.",
        "nutrition_score": 85,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Carrots", "Eggs", "Soy sauce", "Cooking oil"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      }
    },
    "day_3": {
      "breakfast": {
        "meal_name": "Mixed Rice Bowl",
        "ingredients_used": ["Rice", "Carrots", "Eggs", "Soy Sauce"],
        "recipe_summary": "Steamed rice bowl topped with seasoned eggs and a splash of soy sauce.",
        "nutrition_score": 84,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Carrots", "Eggs", "Soy sauce"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      },
      "lunch": {
        "meal_name": "Carrot Stir Fry",
        "ingredients_used": ["Rice", "Carrots", "Eggs", "Cooking Oil"],
        "recipe_summary": "Sautéed carrot ribbons with scrambled egg ribbons served over warm rice.",
        "nutrition_score": 80,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Carrots", "Eggs", "Cooking oil"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      },
      "dinner": {
        "meal_name": "Egg Fried Rice",
        "ingredients_used": ["Rice", "Eggs", "Soy Sauce", "Carrots", "Cooking Oil"],
        "recipe_summary": "Classic egg fried rice seasoned with soy sauce and tossed with carrots.",
        "nutrition_score": 83,
        "cost_estimate": 0,
        "inventory_consumed": ["Rice", "Eggs", "Soy sauce", "Carrots", "Cooking oil"],
        "waste_prevented": ["Carrots"],
        "status": "Pending"
      }
    }
  },
  "weekly_plan": {},
  "shopping_list": [
    {
      "item": "Carrots",
      "qty": "500 g",
      "cost": 150,
      "priority": "medium"
    },
    {
      "item": "Eggs",
      "qty": "10 pcs",
      "cost": 480,
      "priority": "high"
    }
  ],
  "household_economics": {
    "waste_prevented_items": ["Eggs", "Carrots", "Chicken"],
    "inventory_utilization_score": "94%",
    "nutrition_score": "82/100",
    "estimated_cost": 630.0,
    "estimated_savings": 2850.0,
    "family_size": 4
  },
  "agent_reasoning": {
    "urgent_foods_used": ["Carrots"],
    "high_waste_foods_used": ["Carrots"],
    "reflection_result": {
      "status": "PASS",
      "score": 92,
      "reason": "Budget limit respected, perishables successfully scheduled in day 1."
    },
    "reasoning_summary": "HomeOS detected high-waste risk carrots expiring in 24 hours. The planner scheduled carrot-inclusive meals for Day 1 and Day 2, and substituted premium meat with local chicken to save LKR 2,850 under the budget ceiling.",
    "agent_trace": [
      {
        "agent": "Coordinator Agent",
        "input": "Budget: LKR 10000.0 | Family Size: 4 | Inventory: ['rice', 'carrots', 'eggs', 'soy sauce', 'chicken']",
        "decision": "Parsed parameters. Locked target objectives: budget optimization and food waste reduction.",
        "output": "Simulating execution steps. Targets: Max LKR 10000.0, utilize expiring items."
      },
      {
        "agent": "Inventory Agent",
        "input": "Pantry items search query",
        "decision": "Identified carrots (1000g, expiring in 1 day) and chicken (2000g, expiring in 2 days) as urgent stock items.",
        "output": "Flagged carrots & chicken as urgent."
      },
      {
        "agent": "Waste Agent",
        "input": "Spoilage history query",
        "decision": "Calculated carrot spoilage risk score at 0.8 based on previous household logs.",
        "output": "Pushed carrots to Day 1 recipe priority list."
      },
      {
        "agent": "Recipe Retrieval Agent",
        "input": "Pantry vector query",
        "decision": "Searched local collection for chicken and carrot recipes. Retrieved 5 overlapping options.",
        "output": "Selected Braised Chicken and Vegetable Rice as candidates."
      },
      {
        "agent": "Meal Planner Agent",
        "input": "Candidates list",
        "decision": "Structured a 3-day menu utilizing eggs, chicken, carrots, and rice. Avoided duplicates.",
        "output": "Completed 3-day meal plan draft."
      },
      {
        "agent": "Budget Agent",
        "input": "Plan cost appraisal",
        "decision": "Costed draft ingredients against market catalog. Total came to LKR 7,150.",
        "output": "Cost is LKR 7,150. Status: UNDER BUDGET (LKR 2,850 saved)."
      },
      {
        "agent": "Reflection Agent",
        "input": "Constraints check",
        "decision": "Validated that carrots are fully exhausted within the first 48 hours. Approved plan.",
        "output": "Final plan signed off successfully."
      }
    ]
  }
};

export const MOCK_INVENTORY = [
  { "id": 1, "name": "Rice", "current_stock": 4400.0, "original_quantity": 5000.0, "unit": "g", "expiry_date": "2026-08-10", "avg_price": 280.0 },
  { "id": 2, "name": "Carrots", "current_stock": 600.0, "original_quantity": 1000.0, "unit": "g", "expiry_date": "2026-07-27", "avg_price": 320.0 },
  { "id": 3, "name": "Eggs", "current_stock": 16.0, "original_quantity": 24.0, "unit": "pcs", "expiry_date": "2026-07-28", "avg_price": 40.0 },
  { "id": 4, "name": "Soy Sauce", "current_stock": 420.0, "original_quantity": 500.0, "unit": "ml", "expiry_date": "2026-12-20", "avg_price": 600.0 },
  { "id": 5, "name": "Chicken", "current_stock": 1400.0, "original_quantity": 2000.0, "unit": "g", "expiry_date": "2026-07-28", "avg_price": 1450.0 },
  { "id": 6, "name": "Cooking Oil", "current_stock": 960.0, "original_quantity": 1000.0, "unit": "ml", "expiry_date": "2026-12-20", "avg_price": 850.0 },
  { "id": 7, "name": "Onions", "current_stock": 380.0, "original_quantity": 500.0, "unit": "g", "expiry_date": "2026-08-01", "avg_price": 380.0 },
  { "id": 8, "name": "Garlic", "current_stock": 60.0, "original_quantity": 100.0, "unit": "g", "expiry_date": "2026-08-05", "avg_price": 950.0 }
];

export const MOCK_PANTRY_NAMES = ["Rice", "Carrots", "Eggs", "Soy Sauce", "Chicken", "Cooking Oil", "Onions", "Garlic"];

export const MOCK_CONVERSATIONS = [
  { id: "1", sender: "user", text: "What should I cook tonight?" },
  { id: "2", sender: "assistant", text: "I recommend preparing Braised Chicken with Carrots. Your carrots will expire tomorrow, and chicken is already in stock. This utilizes leftover pantry items and saves LKR 1,200." }
];
