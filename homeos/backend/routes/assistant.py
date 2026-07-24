import os
import requests
import asyncio
from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse
from tools.db import get_db_connection
from llm import generate_text
from routes.receipts import _process_and_save_receipt
from datetime import datetime

router = APIRouter()

@router.post("/voice")
async def chat_with_assistant(file: UploadFile = File(...)):
    if not file.content_type or (not file.content_type.startswith("audio/") and file.content_type != "video/webm"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an audio format or webm.")
        
    # 1. Transcribe audio with Groq Whisper
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

    # 2. Query Pantry context
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

    # 3. Generate response using LLM (Gemini 2.5 Flash)
    system_prompt = f"""
You are the HomeOS Voice Assistant, a friendly and concise AI that helps households manage their kitchen.
Current Pantry Inventory: {inventory_str}

CRITICAL INSTRUCTION:
If the user's input is a statement about buying, adding, or purchasing groceries (e.g., "I bought 3 apples", "Add milk to the pantry"), you MUST output EXACTLY this format:
[TOOL_CALL: ADD_RECEIPT]
[RESPONSE: Got it, I've added those items to your pantry.]

If the user's input is a question or anything else, just output:
[RESPONSE: <your conversational answer here>]

Always keep your conversational response in 1 to 2 short sentences. Do not use markdown, emojis, or lists, as your response will be read aloud by a text-to-speech engine.
    """
    
    try:
        raw_llm_response = generate_text(system_prompt, transcript)
        
        # Parse the response for tool calls
        llm_response = "I'm sorry, I couldn't understand that."
        
        if "[TOOL_CALL: ADD_RECEIPT]" in raw_llm_response:
            # Execute the tool call using the transcript as the raw receipt text
            try:
                today = datetime.now().strftime("%Y-%m-%d")
                _process_and_save_receipt(transcript, today, "Voice Assistant")
            except Exception as e:
                print(f"Failed to save voice receipt: {e}")
                
        # Extract just the response part for TTS
        if "[RESPONSE:" in raw_llm_response:
            response_part = raw_llm_response.split("[RESPONSE:")[1]
            llm_response = response_part.replace("]", "").strip()
        else:
            llm_response = raw_llm_response.replace("[TOOL_CALL: ADD_RECEIPT]", "").strip()

    except Exception as e:
        print(f"LLM Error: {e}")
        llm_response = "I'm sorry, I am having trouble connecting to my brain right now."

    # 4. Generate TTS with edge-tts
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
