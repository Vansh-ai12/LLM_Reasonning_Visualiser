from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException

from sqlmodel import Session, select

from models import ReasoningRun, ReasoningStep, User
from db_connect import get_session
from auth import get_current_user

from pydantic import BaseModel
from schemas import RunResponse, StepResponse
from tasks import run_llm_test

router = APIRouter(prefix="/run", tags=["run"], dependencies=[Depends(get_current_user)])

class AskRequest(BaseModel):
    question: str

@router.post("/ask")
def ask_question(
    payload: AskRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user_id = uuid.UUID(current_user["user_id"])
    
    # Create run
    run = ReasoningRun(
        user_id=user_id,
        reasoning_type="research",
        input_data=payload.question,
        output_data=""
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Trigger celery task
    task = run_llm_test.delay(payload.question, str(user_id), str(run.id))

    return {"task_id": task.id, "run_id": run.id}

@router.get("/history", response_model=List[RunResponse])
def get_runs(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user_id = uuid.UUID(current_user["user_id"])
    
    runs = db.exec(select(ReasoningRun).where(ReasoningRun.user_id == user_id).order_by(ReasoningRun.created_at)).all()
    return runs

@router.get("/{run_id}/steps", response_model=List[StepResponse])
def get_steps(
    run_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user_id = uuid.UUID(current_user["user_id"])
    
    # Verify run belongs to user
    run = db.exec(select(ReasoningRun).where(ReasoningRun.id == run_id, ReasoningRun.user_id == user_id)).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found or not authorized")

    steps = db.exec(select(ReasoningStep).where(ReasoningStep.run_id == run_id).order_by(ReasoningStep.id)).all()
    
    mapped_steps = []
    for idx, step in enumerate(steps, start=1):
        step_dict = step.model_dump()
        step_dict["id"] = idx
        mapped_steps.append(step_dict)

    return mapped_steps
