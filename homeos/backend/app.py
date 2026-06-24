# app.py
import sys
import os
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=dotenv_path)
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add parent path to PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tools.db import init_db
from vector_db.qdrant import init_qdrant, client as q_client, COLLECTION_NAME
from routes import plan
from routes import receipts

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler to initialize SQLite tables and index Qdrant collection on startup.
    """
    # 1. Initialize SQLite db
    init_db()
    
    # 2. Initialize Qdrant local vector db
    indexed_count = init_qdrant()
    
    # 3. Check Gemini connection and print status cleanly
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    gemini_connected = False
    if api_key:
        try:
            from google import genai
            test_client = genai.Client(api_key=api_key)
            test_client.models.embed_content(
                model="gemini-embedding-2",
                contents="startup_test",
                config={"output_dimensionality": 768}
            )
            gemini_connected = True
        except Exception:
            pass
            
    if gemini_connected:
        print("Gemini Connected")
        print("Embedding Model: gemini-embedding-2")
    else:
        print("Gemini Connection Failed (using offline fallbacks)")
        print("Embedding Model: None (Offline)")
        
    # Check Qdrant collection status
    try:
        collections = q_client.get_collections().collections
        qdrant_connected = any(c.name == COLLECTION_NAME for c in collections)
    except Exception:
        qdrant_connected = False
        
    if qdrant_connected:
        print("Qdrant Connected")
        print(f"Recipes Indexed: {indexed_count}")
    else:
        print("Qdrant Connection Failed")
        
    yield

app = FastAPI(
    title="HomeOS Economic Intelligence API", 
    version="0.1.0", 
    lifespan=lifespan
)

# CORS setup for local React integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(plan.router, prefix="/api/plan", tags=["Plan"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["Receipts"])

@app.get("/api/inventory")
def get_inventory_direct():
    from routes.plan import get_inventory_api
    return get_inventory_api()

@app.get("/health/ai")
def ai_health():
    """
    Diagnostics endpoint for Gemini, Qdrant, and embedding models connectivity.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return {"gemini": "failed"}
    try:
        from google import genai
        test_client = genai.Client(api_key=api_key)
        test_client.models.embed_content(
            model="gemini-embedding-2",
            contents="healthcheck",
            config={"output_dimensionality": 768}
        )
        
        collections = q_client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        if exists:
            return {
                "gemini": "connected",
                "embedding_model": "gemini-embedding-2",
                "qdrant": "connected"
            }
    except Exception:
        pass
    return {"gemini": "failed"}

@app.get("/health")
@app.get("/")
def health_check():
    """
    Simple health check endpoint.
    """
    return {
        "status": "healthy",
        "message": "HomeOS Economic Intelligence Service is active."
    }
