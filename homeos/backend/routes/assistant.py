import os
import time
import requests
import asyncio
from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from tools.db import get_db_connection
from llm import generate_text
from routes.receipts import _process_and_save_receipt
from datetime import datetime
from logger import log_request_start, log_workflow_step, log_request_success, log_api_error

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_assistant_text(req: ChatRequest):
    """
    Accepts text messages from the mobile assistant screen,
    injects live pantry inventory context, calls Gemini LLM,
    executes receipt ingestion tools if requested, and returns text replies.
    """
    t_start = time.time()
    message = req.message
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    log_request_start("POST", "/api/assistant/chat", f"Query: '{message}'")
    
    # 1. Pantry Lookup
    t_db_start = time.time()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ingredient, quantity, unit FROM Inventory WHERE quantity > 0")
        rows = cursor.fetchall()
        conn.close()
        
        inventory_items = []
        for row in rows:
            try:
                qty = float(row['quantity'])
                if qty > 0:
                    inventory_items.append(f"{qty} {row['unit']} of {row['ingredient'].capitalize()}")
            except ValueError:
                pass
                
        inventory_str = ", ".join(inventory_items) if inventory_items else "The pantry is currently empty."
    except Exception as err:
        inventory_str = "Inventory could not be retrieved."
        
    t_db_sec = time.time() - t_db_start
    log_workflow_step("Pantry Lookup Completed", f"DB Latency: {t_db_sec:.3f} sec | Items Found: {len(inventory_items) if 'inventory_items' in locals() else 0}")

    # 2. Prompt Creation
    t_prompt_start = time.time()
    system_prompt = f"""
You are the HomeOS Assistant, a friendly and concise AI that helps households manage their kitchen.
Current Pantry Inventory: {inventory_str}

CRITICAL INSTRUCTION:
If the user's input is a statement about buying, adding, or purchasing groceries (e.g., "I bought 3 apples", "Add milk to the pantry"), you MUST output EXACTLY this format:
[TOOL_CALL: ADD_RECEIPT]
[RESPONSE: Got it, I've added those items to your pantry.]

If the user's input is a statement about cooking, eating, or consuming something (e.g., "I cooked 2 eggs and 2 slices of bread", "I just ate an apple"), you MUST output EXACTLY this format with the items they consumed:
[TOOL_CALL: CONSUMED_FOOD]
[JSON: [{{"name": "eggs", "quantity": 2}}, {{"name": "bread", "quantity": 2}}]]
[RESPONSE: I've updated the pantry to reflect what you cooked!]

If the user's input is a question or anything else, just output:
[RESPONSE: <your conversational answer here>]

Always keep your conversational response in 1 to 2 short sentences.
    """
    t_prompt_sec = time.time() - t_prompt_start

    # 3. LLM Request with 5-Second Timeout Guard
    t_llm_start = time.time()
    raw_llm_response = ""
    try:
        loop = asyncio.get_event_loop()
        raw_llm_response = await asyncio.wait_for(
            loop.run_in_executor(None, generate_text, system_prompt, message),
            timeout=15.0
        )
        t_llm_sec = time.time() - t_llm_start
        log_workflow_step("LLM Response Received", f"LLM Latency: {t_llm_sec:.2f} sec")
    except asyncio.TimeoutError:
        t_llm_sec = time.time() - t_llm_start
        log_workflow_step("LLM Call Timed Out (>5s)", f"Returning fast fallback response after {t_llm_sec:.2f} sec.")
        raw_llm_response = "[RESPONSE: I'm currently tracking your pantry stock. What meal would you like to plan today?]"
    except Exception as e:
        t_llm_sec = time.time() - t_llm_start
        log_workflow_step("LLM Processing Warning", f"Error: {e}. Using fallback.")
        raw_llm_response = "[RESPONSE: I'm keeping track of your kitchen inventory. How can I help you today?]"

    # 4. Tool Execution & Response Extraction
    t_tool_start = time.time()
    llm_response = "I'm here to help manage your home."
    
    if "[TOOL_CALL: ADD_RECEIPT]" in raw_llm_response:
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            _process_and_save_receipt(message, today, "Text Assistant")
            log_workflow_step("Tool Execution", "Executed ADD_RECEIPT tool to update SQLite inventory.")
        except Exception as e:
            log_workflow_step("Tool Execution Warning", f"Failed to save receipt: {e}")
            
    if "[TOOL_CALL: CONSUMED_FOOD]" in raw_llm_response:
        try:
            import json, re
            json_match = re.search(r'\[JSON:\s*(\[.*?\])\]', raw_llm_response, re.DOTALL)
            if json_match:
                items = json.loads(json_match.group(1))
                conn = get_db_connection()
                cursor = conn.cursor()
                for item in items:
                    cursor.execute("SELECT quantity FROM Inventory WHERE LOWER(ingredient) = ?", (item['name'].lower(),))
                    row = cursor.fetchone()
                    if row:
                        new_qty = max(0.0, float(row['quantity']) - float(item['quantity']))
                        cursor.execute("UPDATE Inventory SET quantity = ? WHERE LOWER(ingredient) = ?", (new_qty, item['name'].lower()))
                conn.commit()
                conn.close()
                log_workflow_step("Tool Execution", f"Executed CONSUMED_FOOD tool. Deducted: {items}")
            else:
                log_workflow_step("Tool Execution Warning", "Regex failed to extract JSON array.")
        except Exception as e:
            log_workflow_step("Tool Execution Warning", f"Failed to deduct consumed food: {e}")
            
    if "[RESPONSE:" in raw_llm_response:
        response_part = raw_llm_response.split("[RESPONSE:")[1]
        llm_response = response_part.replace("]", "").strip()
    elif raw_llm_response:
        import re
        llm_response = raw_llm_response.replace("[TOOL_CALL: ADD_RECEIPT]", "").replace("[TOOL_CALL: CONSUMED_FOOD]", "").strip()
        llm_response = re.sub(r'\[JSON:\s*\[.*?\]\]', '', llm_response, flags=re.DOTALL).strip()

    t_tool_sec = time.time() - t_tool_start
    t_total_sec = time.time() - t_start

    log_request_success(t_total_sec)

    return {
        "response": llm_response,
        "transcript": llm_response,
        "timings": {
            "db_lookup_sec": round(t_db_sec, 3),
            "prompt_creation_sec": round(t_prompt_sec, 4),
            "llm_latency_sec": round(t_llm_sec, 3),
            "tool_execution_sec": round(t_tool_sec, 3),
            "total_sec": round(t_total_sec, 3)
        }
    }

@router.post("/voice")
async def chat_with_assistant(file: UploadFile = File(...)):
    if not file.content_type or (not file.content_type.startswith("audio/") and file.content_type != "video/webm"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an audio format or webm.")
        
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set.")
        
    try:
        audio_content = await file.read()
        
        response = requests.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (file.filename, audio_content, file.content_type)},
            data={"model": "whisper-large-v3-turbo"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Groq API Error: {response.status_code} - {response.text}")
            
        transcript = response.json().get("text", "")
        if not transcript.strip():
            raise HTTPException(status_code=400, detail="Transcription resulted in empty text.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ingredient, quantity, unit FROM Inventory WHERE quantity > 0")
        rows = cursor.fetchall()
        conn.close()
        
        inventory_items = []
        for row in rows:
            try:
                qty = float(row['quantity'])
                if qty > 0:
                    inventory_items.append(f"{qty} {row['unit']} of {row['ingredient'].capitalize()}")
            except ValueError:
                pass
                
        inventory_str = ", ".join(inventory_items) if inventory_items else "The pantry is currently empty."
    except Exception:
        inventory_str = "Inventory could not be retrieved."

    system_prompt = f"""
You are the HomeOS Voice Assistant, a friendly and concise AI that helps households manage their kitchen.
Current Pantry Inventory: {inventory_str}

CRITICAL INSTRUCTION:
If the user's input is a statement about buying, adding, or purchasing groceries (e.g., "I bought 3 apples", "Add milk to the pantry"), you MUST output EXACTLY this format:
[TOOL_CALL: ADD_RECEIPT]
[RESPONSE: Got it, I've added those items to your pantry.]

If the user's input is a statement about cooking, eating, or consuming something (e.g., "I cooked 2 eggs and 2 slices of bread", "I just ate an apple"), you MUST output EXACTLY this format with the items they consumed:
[TOOL_CALL: CONSUMED_FOOD]
[JSON: [{{"name": "eggs", "quantity": 2}}, {{"name": "bread", "quantity": 2}}]]
[RESPONSE: I've updated the pantry to reflect what you cooked!]

If the user's input is a question or anything else, just output:
[RESPONSE: <your conversational answer here>]

Always keep your conversational response in 1 to 2 short sentences. Do not use markdown, emojis, or lists, as your response will be read aloud by a text-to-speech engine.
    """
    
    try:
        raw_llm_response = generate_text(system_prompt, transcript)
        llm_response = "I'm sorry, I couldn't understand that."
        
        if "[TOOL_CALL: ADD_RECEIPT]" in raw_llm_response:
            try:
                today = datetime.now().strftime("%Y-%m-%d")
                _process_and_save_receipt(transcript, today, "Voice Assistant")
            except Exception as e:
                print(f"Failed to save voice receipt: {e}")
                
        if "[TOOL_CALL: CONSUMED_FOOD]" in raw_llm_response:
            try:
                import json, re
                json_match = re.search(r'\[JSON:\s*(\[.*?\])\]', raw_llm_response, re.DOTALL)
                if json_match:
                    items = json.loads(json_match.group(1))
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    for item in items:
                        cursor.execute("SELECT quantity FROM Inventory WHERE LOWER(ingredient) = ?", (item['name'].lower(),))
                        row = cursor.fetchone()
                        if row:
                            new_qty = max(0.0, float(row['quantity']) - float(item['quantity']))
                            cursor.execute("UPDATE Inventory SET quantity = ? WHERE LOWER(ingredient) = ?", (new_qty, item['name'].lower()))
                    conn.commit()
                    conn.close()
            except Exception as e:
                print(f"Failed to deduct consumed food voice: {e}")

        if "[RESPONSE:" in raw_llm_response:
            response_part = raw_llm_response.split("[RESPONSE:")[1]
            llm_response = response_part.replace("]", "").strip()
        else:
            import re
            llm_response = raw_llm_response.replace("[TOOL_CALL: ADD_RECEIPT]", "").replace("[TOOL_CALL: CONSUMED_FOOD]", "").strip()
            llm_response = re.sub(r'\[JSON:\s*\[.*?\]\]', '', llm_response, flags=re.DOTALL).strip()

    except Exception as e:
        llm_response = "I'm sorry, I am having trouble connecting to my brain right now."

    try:
        import edge_tts
        import urllib.parse
        
        communicate = edge_tts.Communicate(llm_response, "en-US-AriaNeural")
        
        async def audio_stream():
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
                    
        encoded_transcript = urllib.parse.quote(llm_response)
        return StreamingResponse(
            audio_stream(), 
            media_type="audio/mpeg", 
            headers={
                "X-Assistant-Transcript": encoded_transcript,
                "Access-Control-Expose-Headers": "X-Assistant-Transcript"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")
