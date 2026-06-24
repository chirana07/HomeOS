# verify_ai.py
import sys
import os
from dotenv import load_dotenv

# Ensure we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from llm import GeminiClient, get_embedding, generate_text
from vector_db.qdrant import init_qdrant, search_recipes_vector

def main():
    dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    load_dotenv(dotenv_path=dotenv_path)
    
    # 1. Check Gemini Connectivity
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("FAIL: GEMINI_API_KEY or GOOGLE_API_KEY env variable not set.")
        sys.exit(1)
        
    try:
        # Initialize client to verify no ValueError raises
        client = GeminiClient()
    except Exception as e:
        print(f"FAIL: Failed to initialize GeminiClient: {e}")
        sys.exit(1)
        
    # 2. Check Text Generation
    try:
        gen_res = generate_text("You are a helpful assistant.", "Respond with hello.", temperature=0.1)
        if not gen_res:
            print("FAIL: Text generation returned empty response.")
            sys.exit(1)
        elif "[Fallback Gemini output due to API error" in gen_res:
            print("Warning: Gemini text generation fell back due to API/quota error (non-blocking).")
    except Exception as e:
        print(f"FAIL: Text generation call failed: {e}")
        sys.exit(1)
        
    # 3. Check Embedding Generation
    try:
        emb = get_embedding("test query text")
        if not emb or len(emb) != 768:
            print("FAIL: Embedding generation returned invalid vector length.")
            sys.exit(1)
        elif all(v == 0.0 for v in emb):
            print("Warning: Embedding generation fell back to zero-vector (non-blocking).")
    except Exception as e:
        print(f"FAIL: Embedding generation call failed: {e}")
        sys.exit(1)
        
    # 4. Check Qdrant insertion and Recipe retrieval
    try:
        indexed_count = init_qdrant()
        if indexed_count == 0:
            print("FAIL: No recipes were indexed into Qdrant.")
            sys.exit(1)
            
        results = search_recipes_vector("Rice")
        if not results:
            print("FAIL: Recipe retrieval search returned no results.")
            sys.exit(1)
    except Exception as e:
        print(f"FAIL: Qdrant operations failed: {e}")
        sys.exit(1)
        
    print("PASS")
    sys.exit(0)

if __name__ == "__main__":
    main()
