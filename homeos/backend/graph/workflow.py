# workflow.py
import sys
import os
from langgraph.graph import StateGraph, END

# Add parent path to allow relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph.state import AgentState
from agents.coordinator import coordinator_agent
from agents.inventory_agent import inventory_agent
from agents.waste_agent import waste_agent
from agents.recipe_agent import recipe_agent
from agents.meal_planner_agent import meal_planner_agent
from agents.budget_agent import budget_agent
from agents.reflection_agent import reflection_agent
from agents.reporting_agent import reporting_agent

# Initialize State Graph
workflow = StateGraph(AgentState)

# Add Agent Node Functions
workflow.add_node("coordinator", coordinator_agent)
workflow.add_node("inventory", inventory_agent)
workflow.add_node("waste", waste_agent)
workflow.add_node("recipe", recipe_agent)
workflow.add_node("meal_planner", meal_planner_agent)
workflow.add_node("budget", budget_agent)
workflow.add_node("reflection", reflection_agent)
workflow.add_node("reporting", reporting_agent)

# Set Entrypoint
workflow.set_entry_point("coordinator")

# Add Sequential Edges
workflow.add_edge("coordinator", "inventory")
workflow.add_edge("inventory", "waste")
workflow.add_edge("waste", "recipe")
workflow.add_edge("recipe", "meal_planner")
workflow.add_edge("meal_planner", "budget")
workflow.add_edge("budget", "reflection")

# Define Routing Function based on Reflection Loop status
def route_reflection(state: AgentState):
    """
    Routes from reflection agent back to meal planner on FAIL (up to MAX_RETRIES=1),
    otherwise proceeds to the reporting agent.
    """
    # Note: retry_count is incremented inside reflection_agent on FAIL
    ref_res = state.get("reflection_result", {})
    status = ref_res.get("status") if isinstance(ref_res, dict) else ref_res
    if status == "FAIL" and state.get("retry_count", 0) <= 1:
        print(f"--- Reflection check FAILED. Triggering self-correction loop. Retry iteration: {state.get('retry_count')} ---")
        return "meal_planner"
    return "reporting"

# Add Conditional Edges
workflow.add_conditional_edges(
    "reflection",
    route_reflection,
    {
        "meal_planner": "meal_planner",
        "reporting": "reporting"
    }
)

# Reporting agent outputs the final report and terminates
workflow.add_edge("reporting", END)

# Compile Graph
compiled_graph = workflow.compile()
