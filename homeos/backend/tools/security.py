import hmac
import hashlib
import base64
import json
import time
import os
from typing import Optional, Dict, Any

SECRET_KEY = os.getenv("JWT_SECRET", "homeos_super_secret_commercial_key_2026_agentrix")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 72

def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2 HMAC SHA256 with a random salt."""
    salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return base64.b64encode(salt + hashed).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a PBKDF2 hashed password string."""
    try:
        decoded = base64.b64decode(hashed_password.encode('utf-8'))
        salt = decoded[:16]
        stored_hash = decoded[16:]
        computed_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(stored_hash, computed_hash)
    except Exception:
        return False

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _base64url_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode(data_str + padding)

def create_access_token(data: dict, expires_delta_hours: int = TOKEN_EXPIRE_HOURS) -> str:
    """Creates a JWT access token signed with HMAC-SHA256."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + (expires_delta_hours * 3600)
    payload["iat"] = int(time.time())

    encoded_header = _base64url_encode(json.dumps(header).encode('utf-8'))
    encoded_payload = _base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        header_str, payload_str, signature_str = parts
        signature_input = f"{header_str}.{payload_str}".encode('utf-8')
        computed_signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
        actual_signature = _base64url_decode(signature_str)

        if not hmac.compare_digest(computed_signature, actual_signature):
            return None

        payload_bytes = _base64url_decode(payload_str)
        payload = json.loads(payload_bytes.decode('utf-8'))

        if "exp" in payload and time.time() > payload["exp"]:
            return None

        return payload
    except Exception:
        return None
