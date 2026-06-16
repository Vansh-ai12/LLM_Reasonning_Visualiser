import uuid

from fastapi import APIRouter, Depends, HTTPException , Response
from sqlmodel import select
from auth import get_current_user
from schemas import UserLogin , UserCreate , UserResponse

from db_connect import get_session

from models import User

from auth import create_token

from pwdlib import PasswordHash

from sqlmodel import Session

from auth import set_auth_cookie

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/login")
def login(user: UserLogin,response:Response ,db: Session = Depends(get_session)):
    try:
        statement = select(User).where(User.email == user.email)
        db_user = db.exec(statement).first()

        if not db_user:
            return {"error": "Invalid email or password"}

        password_hash = PasswordHash.recommended()

        if not password_hash.verify(user.password, db_user.password):
            return {"error": "Invalid email or password"}

        user_id = db_user.id
        email = db_user.email

        token = create_token(user_id, email)

        set_auth_cookie(response, token)

        return {
            "message": "Login successful"
        }

    except Exception as e:
        print(e)
        return {"error": "Some error occurred"}

@router.post("/register")
def register(user: UserCreate ,response: Response, db:Session = Depends(get_session)):

    name = user.name
    email = user.email
    password = user.password
    password_hash = PasswordHash.recommended()

    hashed_password = password_hash.hash(password)

    userNew  = User(name=name , email = email  , password = hashed_password)

    try:
        db.add(userNew)
        db.commit()
        db.refresh(userNew)
    except Exception as e:
        db.rollback()
        print(e)
        return {
            "Error":"Some error occured while creating the user."
        }
    
    token = create_token(userNew.id, userNew.email)

    set_auth_cookie(response, token)

    return {
        "message":"User created successfully",
        "id":userNew.id
    }

@router.get("/status", response_model=UserResponse)
def status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user_id = uuid.UUID(current_user["user_id"])

    user = db.exec(
        select(User).where(User.id == user_id)
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user

@router.post("/logout")
def logout(
    response:Response
):
    response.delete_cookie("Login_Cookie")
    return {"message":"Logged out successfully."}




