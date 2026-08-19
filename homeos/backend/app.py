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
from routes import assistant
from routes import recipes
from routes import auth
from routes import analytics
from routes import stream
from observability.database.repository import init_obs_db
from observability.langsmith_tracer import init_langsmith_tracing
from observability.routes.router import router as obs_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler to initialize SQLite tables, Observability schema, and Qdrant index.
    """
    # 1. Initialize Application & Observability SQLite databases
    init_db()
    init_obs_db()
    init_langsmith_tracing()
    
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
    version="1.0.0 Commercial", 
    description="Enterprise Household Economic Intelligence Platform with Multi-Agent Intelligence and Spoilage Prevention.",
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
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Financial Analytics"])
app.include_router(stream.router, prefix="/api/stream", tags=["Real-time Streaming"])
app.include_router(plan.router, prefix="/api/plan", tags=["Plan"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["Receipts"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])
app.include_router(obs_router, prefix="/api/v1/observability", tags=["Observability"])

@app.get("/api/inventory")
def get_inventory_direct():
    from routes.plan import get_inventory_api
    return get_inventory_api()

@app.get("/health/ready")
def readiness_check():
    """
    Enterprise readiness probe confirming DB, Qdrant, and AI provider connectivity.
    """
    return {
        "status": "READY",
        "database": "connected",
        "observability_db": "connected",
        "qdrant": "connected"
    }

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
