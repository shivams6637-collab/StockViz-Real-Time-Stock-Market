
import os
from datetime import datetime, timedelta, timezone

import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

from database.mongo_db import db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET missing from backend/.env")

JWT_ALGORITHM = "HS256"
TOKEN_HOURS = 12


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


def create_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "iat": now,
            "exp": now + timedelta(hours=TOKEN_HOURS),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please log in")

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        if not user_id or not ObjectId.is_valid(user_id):
            raise ValueError("Invalid user ID")
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }


@router.post("/signup", status_code=201)
def signup(data: SignupRequest):
    email = data.email.strip().lower()

    if db["users"].find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = {
        "name": data.name.strip(),
        "email": email,
        "password_hash": password_hash.hash(data.password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = db["users"].insert_one(user)
    except Exception:
        if db["users"].find_one({"email": email}):
            raise HTTPException(
                status_code=409, detail="Email already registered"
            )
        raise HTTPException(status_code=500, detail="Could not create account")

    user_id = str(result.inserted_id)

    db["funds"].update_one(
        {"account_id": user_id},
        {
            "$setOnInsert": {
                "account_id": user_id,
                "balance": 100000.0,
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )

    return {
        "token": create_token(user_id),
        "user": {"id": user_id, "name": user["name"], "email": email},
    }


@router.post("/login")
def login(data: LoginRequest):
    email = data.email.strip().lower()
    user = db["users"].find_one({"email": email})

    if not user or not password_hash.verify(
        data.password, user.get("password_hash", "")
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])

    db["funds"].update_one(
        {"account_id": user_id},
        {
            "$setOnInsert": {
                "account_id": user_id,
                "balance": 100000.0,
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )

    return {
        "token": create_token(user_id),
        "user": {"id": user_id, "name": user["name"], "email": email},
    }


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return {"user": user}
