from typing import Dict, List, Optional

CULINARY_SUBSTITUTIONS: Dict[str, List[Dict[str, str]]] = {
    "milk": [
        {"substitute": "Coconut Milk", "ratio": "1:1", "notes": "Great for curries and baking."},
        {"substitute": "Yogurt (diluted)", "ratio": "1:1 with water", "notes": "Adds mild tanginess."}
    ],
    "butter": [
        {"substitute": "Cooking Oil", "ratio": "3:4", "notes": "Ideal for frying and roasting."},
        {"substitute": "Ghee", "ratio": "1:1", "notes": "Rich aromatic flavor."}
    ],
    "chicken": [
        {"substitute": "Fish", "ratio": "1:1", "notes": "Quick cooking protein alternative."},
        {"substitute": "Tofu", "ratio": "1:1", "notes": "Plant-based protein replacement."},
        {"substitute": "Eggs", "ratio": "2 eggs per 100g", "notes": "Budget-friendly protein."}
    ],
    "eggs": [
        {"substitute": "Flour + Water paste", "ratio": "2 tbsp per egg", "notes": "Useful binder in baking/batter."},
        {"substitute": "Mashed Banana", "ratio": "1/2 banana per egg", "notes": "Sweet baking substitute."}
    ],
    "spinach": [
        {"substitute": "Cabbage", "ratio": "1:1", "notes": "Crisp green leafy substitute."},
        {"substitute": "Gotukola / Mukunuwenna", "ratio": "1:1", "notes": "Traditional local leafy green."}
    ],
    "tomatoes": [
        {"substitute": "Tamarind paste", "ratio": "1 tsp per tomato", "notes": "Adds rich sourness to curries."},
        {"substitute": "Lime juice", "ratio": "1 tbsp per tomato", "notes": "Fresh acidity boost."}
    ]
}

def get_ingredient_substitutions(ingredient_name: str) -> List[Dict[str, str]]:
    """Returns recommended culinary substitutions for a given ingredient."""
    key = ingredient_name.strip().lower()
    for item, subs in CULINARY_SUBSTITUTIONS.items():
        if item in key:
            return subs
    return [
        {"substitute": "Generic Pantry Equivalent", "ratio": "1:1", "notes": "Adjust seasoning to taste."}
    ]
