import os
import requests
import sys

# Load env manually for test
from dotenv import load_dotenv
load_dotenv('/Users/chirana/Desktop/Agentrix/Agentrix/homeos/backend/.env')

api_key = os.getenv("GROQ_API_KEY")
print("API KEY:", api_key[:10] if api_key else "None")

prompt = "Extract items: bun 2"

try:
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama3-8b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        },
        timeout=15
    )
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)
except Exception as e:
    print("ERROR:", e)
