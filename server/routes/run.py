from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException

from sqlmodel import Session, select

from models import ReasoningRun, ReasoningStep, User
from db_connect import get_session
from auth import get_current_user
from llm.memory import createMemory, retrieveMemory

from pydantic import BaseModel
from schemas import RunResponse, StepResponse
from tasks import run_llm_test

router = APIRouter(prefix="/run", tags=["run"], dependencies=[Depends(get_current_user)])

class AskRequest(BaseModel):
    question: str


def build_memory_context(memories: list[dict]) -> str:
    if not memories:
        return "No relevant long-term memories were found."

    lines = []
    for index, memory in enumerate(memories, start=1):
        memory_type = memory.get("memory_type", "memory")
        created_at = memory.get("created_at", "unknown date")
        text = memory.get("text", "")
        score = memory.get("score")
        score_text = f", score={score:.4f}" if isinstance(score, (int, float)) else ""
        lines.append(f"{index}. [{memory_type}, {created_at}{score_text}] {text}")

    return "\n".join(lines)


def build_prompt_with_memory(question: str, memories: list[dict]) -> str:
    return (
        "Use the memory context only when it is relevant to the question.\n"
        "Do not mention memory unless it directly helps the answer.\n\n"
        "Memory context:\n"
        f"{build_memory_context(memories)}\n\n"
        "Original question:\n"
        f"{question}"
    )


@router.post("/ask")
def ask_question(
    payload: AskRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user_id = uuid.UUID(current_user["user_id"])
    question = payload.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    stored_memory = createMemory(question, str(user_id))
    memories = retrieveMemory(question, str(user_id))
    prompt_with_memory = build_prompt_with_memory(question, memories)
    
    # Create run
    run = ReasoningRun(
        user_id=user_id,
        reasoning_type="research",
        input_data=question,
        output_data=""
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Trigger celery task with question + retrieved memory context
    task = run_llm_test.delay(prompt_with_memory, str(run.id))

    return {
        "task_id": task.id,
        "run_id": run.id,
        "stored_memory": stored_memory,
        "memories": memories,
    }

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
