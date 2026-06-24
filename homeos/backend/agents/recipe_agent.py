# recipe_agent.py
import os
import sys
from graph.state import AgentState

# Add parent path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.recipe_tool import search_recipes

def recipe_agent(state: AgentState):
    """
    Recipe Retrieval Agent searches Qdrant vector database using text-embedding-004. (No LLM, Python Only)
    """
    pantry_names = [item["name"] for item in state.get("inventory", [])]
    urgent_names = state.get("urgent_foods", [])
    
    # RAG search query prioritizing urgent perishables
    query_terms = urgent_names + [name for name in pantry_names if name not in urgent_names]
    search_query = ", ".join(query_terms)
    
    # Query recipes from Qdrant vector DB
    res = search_recipes(search_query)
    recipes_list = res.get("recipes", [])
    
    trace_entry = {
        "agent": "Recipe Retrieval Agent",
        "input": f"Qdrant Query: '{search_query}'",
        "decision": "Successfully conducted similarity search in Qdrant collection using text-embedding-004.",
        "output": f"Retrieved {len(recipes_list)} recipe candidates: {[r['recipe_name'] for r in recipes_list]}"
    }
    
    return {
        "recipes": recipes_list,
        "agent_trace": [trace_entry]
    }
