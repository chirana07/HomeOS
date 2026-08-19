import re

API_KEY_PATTERNS = [
    r'AIzaSy[A-Za-z0-9_-]{33}',        # Google Gemini API key
    r'sk-[A-Za-z0-9_-]{32,64}',          # OpenAI API key
    r'gsk_[A-Za-z0-9_-]{32,64}',         # Groq API key
    r'ls__[A-Za-z0-9_-]{32,64}'          # LangSmith API key
]

PII_PATTERNS = [
    r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b',  # Credit Card
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' # Email Address
]

def sanitize_text(text: str) -> str:
    """
    Sanitizes API keys and sensitive PII from prompt inputs, completions, and error messages.
    """
    if not text or not isinstance(text, str):
        return text

    sanitized = text

    # Redact API keys
    for pattern in API_KEY_PATTERNS:
        sanitized = re.sub(pattern, '[REDACTED_API_KEY]', sanitized)

    # Redact PII
    for pattern in PII_PATTERNS:
        sanitized = re.sub(pattern, '[REDACTED_PII]', sanitized)

    return sanitized
