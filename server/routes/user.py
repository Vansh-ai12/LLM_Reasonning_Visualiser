from fastapi import APIRouter

from schemas import UserLogin , UserCreate , UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/login")
def login(user: UserLogin):
    return


@router.post("/register")
def register(user: UserCreate):
    return

@router.get("/status")
def status():
    return

@router.post("/logout")
def logout():
    return

@router.put("/change_password")
def change_password():
    return


