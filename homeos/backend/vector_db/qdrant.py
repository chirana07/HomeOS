# qdrant.py
import os
import csv
import sys
import json
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Add parent path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from llm import get_embedding

# Initialize Qdrant client in memory
client = QdrantClient(location=":memory:")
COLLECTION_NAME = "recipes"
EMBEDDING_DIM = 768  # gemini-embedding-2 output_dimensionality dimension

def init_qdrant() -> int:
    """
    Initializes Qdrant local in-memory DB and indexes recipes.
    Loads pre-computed embeddings from recipes_with_embeddings.json if available.
    """
    try:
        # Check if collection exists
        collections = client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        
        if exists:
            client.delete_collection(collection_name=COLLECTION_NAME)
            
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )
        
        # 1. Try loading from pre-computed JSON file first (saves API calls & boots instantly)
        json_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'recipes_with_embeddings.json')
        if os.path.exists(json_file):
            try:
                import json
                with open(json_file, 'r', encoding='utf-8') as f:
                    recipes_data = json.load(f)
                    
                points = []
                for idx, r in enumerate(recipes_data):
                    points.append(
                        PointStruct(
                            id=idx,
                            vector=r["vector"],
                            payload={
                                "recipe_name": r["recipe_name"],
                                "ingredients": r["ingredients"],
                                "meal_type": r["meal_type"],
                                "nutrition_score": r["nutrition_score"],
                                "recipe_summary": r["recipe_summary"],
                                "tags": r["tags"]
                            }
                        )
                    )
                if points:
                    client.upsert(collection_name=COLLECTION_NAME, points=points)
                    print(f"Successfully loaded {len(points)} recipe embeddings from JSON cache.")
                    return len(points)
            except Exception as je:
                print(f"Warning: Failed to load pre-computed embeddings from JSON ({je}). Falling back to live embeddings.")

        # 2. Fallback to indexing from recipes.csv (original live indexing loop)
        recipes_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'recipes.csv')
        if not os.path.exists(recipes_file):
            print(f"Error: Recipes database file not found at {recipes_file}")
            return 0
            
        points = []
        with open(recipes_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                name = row.get("recipe_name", "")
                ingredients_str = row.get("ingredients", "")
                ingredients = [i.strip() for i in ingredients_str.split(";")]
                meal_type = row.get("meal_type", "")
                nutrition_score = int(row.get("nutrition_score", 0))
                summary = row.get("recipe_summary", "")
                tags = [t.strip() for t in row.get("tags", "").split(";")] if row.get("tags") else []
                
                # Consumption model fields
                ingredients_json = json.loads(row.get("ingredients_json", "{}"))
                portion_per_person = row.get("portion_per_person", "true").lower() == "true"
                
                # Create document text representation to embed
                text_content = f"Recipe: {name}. Ingredients: {', '.join(ingredients)}. Meal Type: {meal_type}. Summary: {summary}. Tags: {', '.join(tags)}."
                vector = get_embedding(text_content)
                
                payload = {
                    "recipe_name": name,
                    "ingredients": ingredients,
                    "meal_type": meal_type,
                    "nutrition_score": nutrition_score,
                    "recipe_summary": summary,
                    "tags": tags,
                    "ingredients_json": ingredients_json,
                    "portion_per_person": portion_per_person
                }
                
                points.append(
                    PointStruct(
                        id=idx,
                        vector=vector,
                        payload=payload
                    )
                )
        
        if points:
            client.upsert(collection_name=COLLECTION_NAME, points=points)
            return len(points)
    except Exception as e:
        print(f"Error initializing Qdrant collection: {e}")
    return 0

def search_recipes_vector(query: str, limit: int = 20):
    """
    Performs cosine similarity search using Gemini embeddings.
    Falls back to a keyword match if no key is set.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return fallback_keyword_search(query, limit)
        
    try:
        query_vector = get_embedding(query)
        # Handle cases where embedding failed (returned zeros vector)
        if all(v == 0.0 for v in query_vector):
            return fallback_keyword_search(query, limit)
            
        results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=limit
        )
        return [hit.payload for hit in results.points]
    except Exception as e:
        print(f"Error performing vector search: {e}")
        return fallback_keyword_search(query, limit)

def fallback_keyword_search(query: str, limit: int = 20):
    """
    Simulated text search fallback for offline/no-key runs.
    """
    recipes_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'recipes.csv')
    results = []
    if not os.path.exists(recipes_file):
        return []
        
    terms = [t.strip().lower() for t in query.split(",") if t.strip()]
    with open(recipes_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("recipe_name", "")
            ingredients = [i.strip() for i in row.get("ingredients", "").split(";")]
            meal_type = row.get("meal_type", "")
            nutrition_score = int(row.get("nutrition_score", 0))
            summary = row.get("recipe_summary", "")
            tags = [t.strip() for t in row.get("tags", "").split(";")] if row.get("tags") else []
            
            ingredients_json = json.loads(row.get("ingredients_json", "{}"))
            portion_per_person = row.get("portion_per_person", "true").lower() == "true"
            
            match_count = 0
            text_space = f"{name} {' '.join(ingredients)} {meal_type} {summary} {' '.join(tags)}".lower()
            for term in terms:
                if term in text_space:
                    match_count += 1
            
            results.append({
                "recipe_name": name,
                "ingredients": ingredients,
                "meal_type": meal_type,
                "nutrition_score": nutrition_score,
                "recipe_summary": summary,
                "tags": tags,
                "ingredients_json": ingredients_json,
                "portion_per_person": portion_per_person,
                "match_count": match_count
            })
            
    results.sort(key=lambda x: x["match_count"], reverse=True)
    return [{k: v for k, v in r.items() if k != "match_count"} for r in results[:limit]]
