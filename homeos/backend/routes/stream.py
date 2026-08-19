import asyncio
import json
import time
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

class StreamPlanRequest(BaseModel):
    budget: float = 15000.0
    family_size: int = 4
    dietary_restrictions: list = []

@router.post("/plan")
async def stream_plan_generation(req: StreamPlanRequest):
    """
    Server-Sent Events (SSE) endpoint providing real-time step-by-step
    agent execution streaming to the frontend.
    """
    async def event_generator():
        steps = [
            {"agent": "Coordinator", "status": "Parsing budget and household parameters...", "progress": 12},
            {"agent": "Inventory Agent", "status": "Querying persistent SQLite pantry database...", "progress": 25},
            {"agent": "Waste Agent", "status": "Calculating spoilage risk scores & prioritizing perishable items...", "progress": 38},
            {"agent": "Recipe Retrieval Agent", "status": "Executing Qdrant vector search with Gemini embeddings...", "progress": 52},
            {"agent": "Meal Planner Agent", "status": "Synthesizing 3-day meal plan with Google Gemini 2.0 Flash...", "progress": 70},
            {"agent": "Budget Agent", "status": "Calculating ingredient costs & generating optimal shopping list...", "progress": 85},
            {"agent": "Reflection Agent", "status": "Evaluating constraint satisfaction & issuing PASS verdict...", "progress": 95},
            {"agent": "Reporting Agent", "status": "Finalizing meal schedule report and state persistence.", "progress": 100}
        ]

        for step in steps:
            await asyncio.sleep(0.4)
            data = json.dumps(step)
            yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
