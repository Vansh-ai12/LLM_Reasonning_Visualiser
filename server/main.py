from fastapi import Depends, FastAPI

from fastapi.middleware.cors import CORSMiddleware

from sqlmodel import Session, text , SQLModel

from db_connect import get_session , engine

from models import *

SQLModel.metadata.create_all(engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],    
    allow_headers=["*"],
)

@app.get("/" ,)
def read_root():
    return {"Message": "Server is running!!!"}


@app.get("/health")
def health_check(
    session: Session = Depends(get_session)
):
    session.exec(text("SELECT 1"))

    return {
        "status": "Database Connected"
    }