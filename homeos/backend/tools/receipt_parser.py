import re
import os
import json
import requests

def parse_receipt_regex(text: str):
    """
    Fallback Regex parser logic for raw receipt text.
    """
    valid_items = []
    warnings = []
    
    qty_end_pattern = re.compile(r'([\d\.]+)\s*([a-zA-Z]*)$')
    qty_start_pattern = re.compile(r'^([\d\.]+)\s*([a-zA-Z]+)?(.*)')
    
    for line_raw in text.splitlines():
        line = line_raw.strip()
        if not line:
            continue
            
        parts = re.split(r'[-–—]', line)
        if len(parts) < 2:
            warnings.append(f"Invalid format (missing price separator '-'): {line}")
            continue
            
        left_part = '-'.join(parts[:-1]).strip()
        price_str = parts[-1].strip()
        
        clean_price = re.sub(r'[^\d\.]', '', price_str)
        try:
            if not clean_price:
                raise ValueError("Empty price")
            price = float(clean_price)
        except ValueError:
            warnings.append(f"Invalid price format: {line}")
            continue
            
        match_end = qty_end_pattern.search(left_part)
        if match_end and match_end.start() > 0:
            qty = match_end.group(1)
            unit = match_end.group(2) or "pieces"
            name = left_part[:match_end.start()].strip()
            valid_items.append({"name": name, "quantity": qty, "unit": unit, "price": price})
            continue
            
        match_start = qty_start_pattern.search(left_part)
        if match_start:
            qty = match_start.group(1)
            unit_guess = match_start.group(2) or ""
            rest = match_start.group(3).strip()
            if rest:
                unit = unit_guess
                name = rest
            else:
                unit = "pieces"
                name = unit_guess
            if name:
                valid_items.append({"name": name, "quantity": qty, "unit": unit, "price": price})
                continue
            
        if left_part:
            valid_items.append({"name": left_part, "quantity": "1", "unit": "pieces", "price": price})
            continue
            
        warnings.append(f"Could not parse quantity and name: {line}")
        
    return valid_items, warnings

def parse_receipt_text(text: str):
    """
    Parses raw receipt text into a list of structured items.
    Tries to use Groq API first if GROQ_API_KEY is available.
    Falls back to regex if it fails or if the key is missing.
    Returns:
        valid_items: list of dicts {"name": str, "quantity": str, "unit": str, "price": float}
        warnings: list of strings indicating lines that failed to parse
    """
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")
    
    if api_key:
        try:
            prompt = (
                "You are a grocery receipt parser. Extract the items from the following receipt text "
                "and return ONLY a valid JSON array of objects. Do not include markdown blocks or any other text. "
                "Each object must have these exactly keys: 'name' (string), 'quantity' (string), 'unit' (string), and 'price' (number). "
                "If a unit or quantity is missing, infer it logically (e.g. quantity '1', unit 'pieces').\\n\\n"
                f"Receipt Text:\\n{text}"
            )
            
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1
                },
                timeout=15
            )
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                # Clean up any potential markdown formatting the LLM might have added despite instructions
                content = content.replace("```json", "").replace("```", "").strip()
                
                valid_items = json.loads(content)
                
                # Validate the structure returned by Groq
                clean_items = []
                for item in valid_items:
                    if "name" in item and "price" in item:
                        clean_items.append({
                            "name": str(item["name"]),
                            "quantity": str(item.get("quantity", "1")),
                            "unit": str(item.get("unit", "pieces")),
                            "price": float(item["price"])
                        })
                
                return clean_items, [] # Return clean items and no warnings if LLM succeeds
            else:
                print(f"Groq API Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Groq API Parsing failed, falling back to regex: {e}")
            pass # Fallback to regex below
            
    # Fallback to Regex Parser
    return parse_receipt_regex(text)
