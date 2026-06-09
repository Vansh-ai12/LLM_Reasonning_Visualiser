from fastapi import APIRouter, Depends

from auth import get_current_user
from schemas import UserLogin , UserCreate , UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/login")
def login(user: UserLogin):
    return


@router.post("/register")
def register(user: UserCreate):
    return

@router.get("/status")
def status(
    current_user=Depends(get_current_user)
):
    return

@router.post("/logout")
def logout(
    current_user=Depends(get_current_user)
):
    return

@router.put("/change_password")
def change_password():
    return


