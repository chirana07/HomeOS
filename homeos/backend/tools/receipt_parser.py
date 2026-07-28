import re
import os
import json
import requests
from typing import Any, Dict, List, Tuple

def normalize_str(val: Any, default: str = "") -> str:
    """
    Defensively normalizes string inputs from OCR/LLM responses.
    Handles lists, tuples, dicts, None, numbers gracefully without throwing AttributeError.
    """
    if val is None:
        return default
    if isinstance(val, (list, tuple)):
        if len(val) == 0:
            return default
        first = val[0]
        if isinstance(first, dict):
            return str(first.get("name") or first.get("item") or default).strip()
        return str(first).strip()
    if isinstance(val, dict):
        return str(val.get("name") or val.get("item") or default).strip()
    return str(val).strip()

def normalize_float(val: Any, default: float = 0.0) -> float:
    """
    Defensively converts numbers/strings/lists to float without throwing ValueError or TypeError.
    """
    if val is None:
        return default
    if isinstance(val, (list, tuple)):
        if len(val) == 0:
            return default
        val = val[0]
    try:
        if isinstance(val, str):
            clean = re.sub(r'[^\d\.]', '', val)
            return float(clean) if clean else default
        return float(val)
    except (ValueError, TypeError):
        return default

def normalize_item(item: Any) -> Dict[str, Any]:
    """
    Normalizes any OCR/LLM item dictionary into a canonical schema.
    Guarantees:
    - name: str (cleanly stripped)
    - quantity: str (valid float string)
    - unit: str
    - price: float
    """
    if not isinstance(item, dict):
        return {
            "name": "Unknown Item",
            "quantity": "1.0",
            "unit": "pcs",
            "price": 0.0
        }
        
    raw_name = item.get("name") or item.get("item") or item.get("description") or "Item"
    name = normalize_str(raw_name, "Item")
    
    raw_qty = item.get("quantity") or item.get("qty") or "1.0"
    qty_val = normalize_float(raw_qty, 1.0)
    
    raw_unit = item.get("unit") or item.get("measure") or "pcs"
    unit = normalize_str(raw_unit, "pcs")
    
    raw_price = item.get("price") or item.get("cost") or 0.0
    price_val = normalize_float(raw_price, 0.0)
    
    return {
        "name": name,
        "quantity": str(qty_val if qty_val > 0 else 1.0),
        "unit": unit if unit else "pcs",
        "price": price_val
    }

def parse_receipt_regex(text: str):
    """
    Fallback Regex parser logic for raw receipt text.
    """
    valid_items = []
    warnings = []
    
    qty_end_pattern = re.compile(r'([\d\.]+)\s*([a-zA-Z]*)$')
    qty_start_pattern = re.compile(r'^([\d\.]+)\s*([a-zA-Z]+)?(.*)')
    
    lines = text.splitlines() if isinstance(text, str) else [str(text)]
    for line_raw in lines:
        line = normalize_str(line_raw)
        if not line:
            continue
            
        parts = re.split(r'[-–—]', line)
        if len(parts) < 2:
            warnings.append(f"Invalid format (missing price separator '-'): {line}")
            continue
            
        left_part = '-'.join(parts[:-1]).strip()
        price_str = parts[-1].strip()
        
        price = normalize_float(price_str, 0.0)
            
        match_end = qty_end_pattern.search(left_part)
        if match_end and match_end.start() > 0:
            qty = match_end.group(1)
            unit = match_end.group(2) or "pcs"
            name = left_part[:match_end.start()].strip()
            valid_items.append(normalize_item({"name": name, "quantity": qty, "unit": unit, "price": price}))
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
                unit = "pcs"
                name = unit_guess
            if name:
                valid_items.append(normalize_item({"name": name, "quantity": qty, "unit": unit, "price": price}))
                continue
            
        if left_part:
            valid_items.append(normalize_item({"name": left_part, "quantity": "1", "unit": "pcs", "price": price}))
            continue
            
        warnings.append(f"Could not parse quantity and name: {line}")
        
    return valid_items, warnings

def parse_receipt_text(text: Any):
    """
    Parses raw receipt text into a list of structured items.
    Tries to use Groq API first if GROQ_API_KEY is available.
    Falls back to regex if it fails or if the key is missing.
    Returns:
        valid_items: list of dicts {"name": str, "quantity": str, "unit": str, "price": float}
        warnings: list of strings indicating lines that failed to parse
    """
    text_str = normalize_str(text)
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")
    
    if api_key and text_str:
        try:
            prompt = (
                "You are a grocery receipt parser. Extract the items from the following receipt text "
                "and return ONLY a valid JSON array of objects. Do not include markdown blocks or any other text. "
                "Each object must have these exact keys: 'name' (string), 'quantity' (string), 'unit' (string), and 'price' (number). "
                "If a unit or quantity is missing, infer it logically (e.g. quantity '1', unit 'pcs').\n\n"
                f"Receipt Text:\n{text_str}"
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
                timeout=5
            )
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                content = content.replace("```json", "").replace("```", "").strip()
                
                raw_items = json.loads(content)
                if isinstance(raw_items, dict):
                    raw_items = raw_items.get("items") or [raw_items]
                    
                clean_items = []
                if isinstance(raw_items, list):
                    for item in raw_items:
                        clean_items.append(normalize_item(item))
                        
                return clean_items, []
            else:
                print(f"Groq API Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Groq API Parsing failed, falling back to regex: {e}")
            pass
            
    # Fallback to Regex Parser
    return parse_receipt_regex(text_str)
