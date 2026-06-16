from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Response
import jwt

from dotenv import load_dotenv
import os
import uuid

from fastapi import Cookie, HTTPException

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


def create_token(user_id : uuid.UUID , email: str):
    payload = {"user_id": str(user_id), "email": email , "exp": datetime.utcnow() + timedelta(hours=1)}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token



def verify_token(token: str)-> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None



def get_current_user(
    Login_Cookie: str | None = Cookie(default=None)
):
    if Login_Cookie is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    payload = verify_token(Login_Cookie)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    return payload


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="Login_Cookie",
        value=token,
        httponly=True,
        secure=False,  # True in production
        samesite="lax",
        max_age=60 * 60 * 24 * 2
    )