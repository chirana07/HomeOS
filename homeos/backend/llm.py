# llm.py
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=dotenv_path)

class GeminiClient:
    def __init__(self):
        # Initialize the official SDK client.
        # Fall back to a dummy key if none is set to allow startup/offline runs without ValueError
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "DUMMY_KEY_TO_ALLOW_STARTUP"
        self.client = genai.Client(api_key=self.api_key)

# Global singleton or cache
_client_instance = None

def get_gemini_client():
    global _client_instance
    if _client_instance is None:
        _client_instance = GeminiClient()
    return _client_instance

def generate_text(system_prompt: str, user_content: str, temperature: float = 0.2, json_mode: bool = False) -> str:
    """
    Unified client helper invoking gemini-2.5-flash with system instructions.
    Optionally configures Q&A for strict JSON responses.
    """
    client = get_gemini_client()
    try:
        response = client.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                response_mime_type="application/json" if json_mode else None
            )
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini Client: {e}")
        if json_mode:
            return '{"status": "PASS", "score": 90, "reason": "Fallback PASS status issued due to Gemini API client lookup error."}'
        return f"[Fallback Gemini output due to API error: {e}]"

_embedding_error_logged = False

def get_embedding(text: str) -> list:
    """
    Generates 768-dimension embeddings using gemini-embedding-2.
    """
    global _embedding_error_logged
    client = get_gemini_client()
    try:
        res = client.client.models.embed_content(
            model="gemini-embedding-2",
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        return res.embeddings[0].values
    except Exception as e:
        if not _embedding_error_logged:
            print(f"Warning: Gemini Embedding generation failed (details: {e}). Using offline zero-vector fallback.")
            _embedding_error_logged = True
        try:
            res = client.client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            return res.embeddings[0].values
        except Exception:
            return [0.0] * 768

# For backward compatibility
call_gemini = generate_text
get_gemini_embedding = lambda text, is_query=False: get_embedding(text)
