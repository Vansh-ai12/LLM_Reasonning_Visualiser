from fastapi import Depends, FastAPI

from fastapi.middleware.cors import CORSMiddleware

from sqlmodel import Session, text , SQLModel

from db_connect import get_session , engine

from routes.user import router as user_router
from routes.cluster import router as cluster_router 

from celery.result import AsyncResult

from tasks import add
from tasks import app as celery_app

from models import *

SQLModel.metadata.create_all(engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],    
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(cluster_router)

@app.get("/" ,)
def read_root():
    task=add.delay(4, 6)
    return {"Message": "Server is running!!!" ,  "task_id": task.id}


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

    result = AsyncResult(task_id, app=celery_app)

    return {
        "state": result.state,
        "result": result.result
    }