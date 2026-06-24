# recipe_tool.py
import sys
import os

# Add parent path to allow relative imports in tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vector_db.qdrant import search_recipes_vector

def search_recipes(query: str = ""):
    """
    Search Qdrant vector database for candidate recipes matching query terms (e.g., inventory ingredients).
    """
    results = search_recipes_vector(query, limit=20)
    return {"recipes": results}
