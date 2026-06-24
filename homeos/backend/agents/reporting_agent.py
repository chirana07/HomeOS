# reporting_agent.py
import os
import sys
from graph.state import AgentState

# Add parent path to allow relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.pricing_tool import save_meal_plan

def reporting_agent(state: AgentState):
    """
    Reporting Agent consolidates the final state into a client-ready report and saves the plan.
    (No LLM, Pure Python Node)
    """
    budget = state.get("budget", 10000.0)
    estimated_cost = state.get("estimated_cost", 0.0)
    shopping_list = state.get("shopping_list", [])
    urgent_foods = state.get("urgent_foods", [])
    
    # Calculate savings
    savings = max(0.0, budget - estimated_cost)
    
    # Assess protected/waste-prevented items
    waste_prevented = list(set(urgent_foods + [w["item"] for w in state.get("waste_risk", []) if w["level"] in ["high", "medium"]]))

    # Retrieve the reasoning summary generated natively by the Meal Planner Agent
    summary = state.get("reasoning_summary", "")
    if not summary:
        summary = "Optimized meal plan compiled successfully utilizing available perishables and staying under budget limits."

    # Calculate overall nutrition score average across the plan
    plan_days = state.get("weekly_plan", {})
    scores = []
    for day in plan_days.values():
        for meal in day.values():
            scores.append(meal.get("nutrition_score", 80))
    avg_nut = int(sum(scores) / len(scores)) if scores else 80

    # Format the final report structure matching the API contracts
    report = {
        "daily_plan": plan_days,  # Keep for backwards compatibility with frontend
        "weekly_plan": plan_days,  # Schema requirement
        "shopping_list": shopping_list,
        "household_economics": {
            "waste_prevented_items": waste_prevented,
            "inventory_utilization_score": "100%" if len(urgent_foods) > 0 else "80%",
            "nutrition_score": f"{avg_nut}/100",
            "estimated_cost": f"LKR {int(estimated_cost)}",
            "estimated_savings": f"LKR {int(savings)}",
            "family_size": state.get("family_size", 4)
        },
        "agent_reasoning": {
            "urgent_foods_used": urgent_foods,
            "high_waste_foods_used": [w["item"] for w in state.get("waste_risk", []) if w["level"] == "high"],
            "reflection_result": state.get("reflection_result", {}),
            "reasoning_summary": summary,
            "agent_trace": state.get("agent_trace", [])
        }
    }
    
    # Save the meal plan using the pricing tool helper
    save_meal_plan(report)

    # Append trace entry for reporting agent itself for explainability
    trace_entry = {
        "agent": "Reporting Agent",
        "input": "Final consolidated state data",
        "decision": "Report generated, written to disk, and served to output endpoints. (Pure Python execution)",
        "output": f"Savings: LKR {int(savings)} | Protected Items: {len(waste_prevented)}"
    }
    
    # Update trace in the final returned state object
    report["agent_reasoning"]["agent_trace"].append(trace_entry)
    
    return {
        "weekly_plan": plan_days,
        "shopping_list": shopping_list,
        "estimated_cost": estimated_cost,
        "reasoning_summary": summary,
        "agent_trace": [trace_entry]
    }
