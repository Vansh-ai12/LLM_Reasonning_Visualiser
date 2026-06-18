from fastapi import Depends, FastAPI

from fastapi.middleware.cors import CORSMiddleware

from qdrant_client import QdrantClient
from sqlmodel import Session, text , SQLModel

from db_connect import get_session , engine

from routes.user import router as user_router
from routes.run import router as run_router

from celery.result import AsyncResult

from tasks import run_llm_test
from tasks import app as celery_app

from models import *

import os

from dotenv import load_dotenv

QDRANT_URL =  os.getenv("QDRANT_URL")

QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)


SQLModel.metadata.create_all(engine)



app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(user_router)
app.include_router(run_router)

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


@app.get("/task/{task_id}")
def get_task(task_id: str):

    result = AsyncResult(
        task_id,
        app=celery_app
    )

    response = {
        "task_id": task_id,
        "state": result.state
    }

    if result.ready():
        response["result"] = result.result

    return response



@app.get("/debug-memory")
def debug_memory():
    return client.get_collection("Memory")