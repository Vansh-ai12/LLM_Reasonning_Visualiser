from celery import Celery

from dotenv import find_dotenv, load_dotenv
import os

from llm.system_prompts import SYSTEM_PROMPT_1

from llm.services import run_inference_and_build_steps

from transformers import AutoModelForCausalLM, BitsAndBytesConfig, AutoTokenizer

from llm.memory import createMemory , retrieveMemory

import torch

load_dotenv()

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
    user_id: str
):

    memories = retrieveMemory(
        question,
        user_id
    )

    memory_context = ""

    for memory in memories:
        memory_context += (
            f"[{memory['memory_type']}] "
            f"{memory['text']}\n"
        )

    enhanced_prompt = f"""
    {SYSTEM_PROMPT}

    Relevant User Memories:

    {memory_context}
    """

    final_answer, steps = run_inference_and_build_steps(
        model,
        tokenizer,
        question,
        enhanced_prompt
    )

    createMemory(
        f"Question: {question}\nAnswer: {final_answer}",
        user_id
     )

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


