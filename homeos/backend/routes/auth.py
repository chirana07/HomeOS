import json
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from tools.db import get_db_connection
from tools.security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class PreferencesUpdateRequest(BaseModel):
    currency: Optional[str] = "LKR"
    dietary_preferences: Optional[List[str]] = []
    household_size: Optional[int] = 4
    monthly_budget: Optional[float] = 15000.0

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        # Fallback to default admin for unauthenticated dev/demo requests
        return {"id": 1, "email": "admin@homeos.ai", "full_name": "Commercial Admin"}
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name FROM users WHERE id = ?", (payload["sub"],))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    
    return dict(user)

@router.post("/register")
def register_user(req: RegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    hashed_pass = hash_password(req.password)
    cursor.execute("INSERT INTO users (email, full_name, hashed_password) VALUES (?, ?, ?)",
                   (req.email.lower(), req.full_name, hashed_pass))
    user_id = cursor.lastrowid
    
    # Initialize default user preferences
    cursor.execute("""
        INSERT INTO user_preferences (user_id, currency, dietary_preferences, household_size, monthly_budget)
        VALUES (?, 'LKR', '[]', 4, 15000.0)
    """, (user_id,))
    
    conn.commit()
    conn.close()
    
    access_token = create_access_token({"sub": user_id, "email": req.email.lower()})
    return {
        "success": True,
        "token": access_token,
        "user": {
            "id": user_id,
            "email": req.email.lower(),
            "full_name": req.full_name
        }
    }

@router.post("/login")
def login_user(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, email, full_name, hashed_password FROM users WHERE email = ?", (req.email.lower(),))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    return {
        "success": True,
        "token": access_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

@router.get("/me")
def get_user_profile(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT currency, dietary_preferences, household_size, monthly_budget FROM user_preferences WHERE user_id = ?", (user["id"],))
    row = cursor.fetchone()
    conn.close()
    
    pref = {
        "currency": "LKR",
        "dietary_preferences": [],
        "household_size": 4,
        "monthly_budget": 15000.0
    }
    
    if row:
        pref["currency"] = row["currency"]
        pref["household_size"] = row["household_size"]
        pref["monthly_budget"] = row["monthly_budget"]
        try:
            pref["dietary_preferences"] = json.loads(row["dietary_preferences"])
        except Exception:
            pref["dietary_preferences"] = []
            
    return {
        "user": user,
        "preferences": pref
    }

@router.put("/preferences")
def update_user_preferences(req: PreferencesUpdateRequest, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    dietary_json = json.dumps(req.dietary_preferences or [])
    cursor.execute("""
        INSERT INTO user_preferences (user_id, currency, dietary_preferences, household_size, monthly_budget)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            currency = excluded.currency,
            dietary_preferences = excluded.dietary_preferences,
            household_size = excluded.household_size,
            monthly_budget = excluded.monthly_budget
    """, (user["id"], req.currency, dietary_json, req.household_size, req.monthly_budget))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": "User preferences updated successfully."
    }
