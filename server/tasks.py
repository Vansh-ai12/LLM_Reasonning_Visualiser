from celery import Celery

from dotenv import find_dotenv, load_dotenv
import os

from llm.system_prompts import SYSTEM_PROMPT_1

from llm.services import run_inference_and_build_steps

from transformers import AutoModelForCausalLM, BitsAndBytesConfig, AutoTokenizer

from llm.memory import createMemory , retrieveMemory

import torch

load_dotenv()

from db_connect import engine
from sqlmodel import Session
from models import ReasoningRun, ReasoningStep
import json

MAX_STEPS = 10 

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"

SYSTEM_PROMPT = SYSTEM_PROMPT_1

REDIS_URL = os.getenv("REDIS_URL")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)
        
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
)



app = Celery(
    'tasks',
    broker = REDIS_URL,
    backend = REDIS_URL
)

@app.task
def add(x, y):
        return x + y

@app.task
def run_llm_test(
    question: str,
    user_id: str,
    run_id: str = None
):

    memories = retrieveMemory(
        question,
        user_id
    )

    memory_context = ""

    for memory in memories:
        memory_context += (
            f"[{memory['memory_type']}] "
            f"[{memory['created_at']}] "
            f"{memory['text']}\n"
        )

    enhanced_prompt = f"""
    {SYSTEM_PROMPT}

    Relevant User Memories:

    {memory_context}
    """

    def save_step_callback(step_dict):
        if run_id:
            try:
                with Session(engine) as session:
                    run = session.get(ReasoningRun, run_id)
                    if run:
                        step = ReasoningStep(
                            run_id=run.id,
                            type=step_dict.get("type", "hypothesis"),
                            confidence=step_dict.get("confidence", "medium"),
                            label=step_dict.get("label", "Step"),
                            content=step_dict.get("content", ""),
                            depends_on=json.dumps(step_dict.get("depends_on", [])),
                            entropy=step_dict.get("entropy"),
                        )
                        session.add(step)
                        session.commit()
            except Exception as e:
                print(f"Error saving to DB: {e}")

    final_answer, steps = run_inference_and_build_steps(
        model,
        tokenizer,
        question,
        enhanced_prompt,
        step_callback=save_step_callback
    )

    createMemory(
        f"Question: {question}\nAnswer: {final_answer}",
        user_id
     )

    if run_id:
        try:
            with Session(engine) as session:
                run = session.get(ReasoningRun, run_id)
                if run:
                    run.output_data = final_answer
                    session.add(run)
                    session.commit()
        except Exception as e:
            print(f"Error saving to DB: {e}")

    return {
        "final_answer": final_answer,
        "steps": steps,
        "retrieved_memories": memories
    }


@app.task(name="tasks.createMem")
def createMem(question: str, user_id: str):
        return createMemory(question,user_id)

@app.task(name="tasks.retrieveMem")
def retrieveMem(question: str, user_id: str):
        return retrieveMemory(question,user_id)


