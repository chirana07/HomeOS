# state.py
from typing import List, Dict, Any, TypedDict, Annotated

def merge_trace(left: list, right: list) -> list:
    """
    State reducer function to accumulate trace steps from all agent runs.
    """
    return left + right

class AgentState(TypedDict):
    # Inputs
    budget: float
    family_size: int
    inventory: List[Dict[str, Any]]
    
    # State items computed by sub-agents
    urgent_foods: List[str]
    waste_risk: List[Dict[str, Any]]
    recipes: List[Dict[str, Any]]
    meal_history: List[str]    # Past meals to avoid repeating
    
    # Weekly meal plan (Day 1 through Day 7)
    weekly_plan: Dict[str, Any]  # Structure: {"day_1": {"breakfast": {...}, "lunch": {...}, "dinner": {...}}, ...}
    
    # Costing and shopping details
    shopping_list: List[Dict[str, Any]]
    estimated_cost: float
    reasoning_summary: str
    
    # Loop and control parameters
    reflection_result: Dict[str, Any]  # {"status": "PASS/FAIL", "score": int, "reason": "..."}
    retry_count: int
    agent_trace: Annotated[list, merge_trace]
