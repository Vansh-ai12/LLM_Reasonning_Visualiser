from celery import Celery

from dotenv import find_dotenv, load_dotenv
import os

from llm.system_prompts import SYSTEM_PROMPT_1

from llm.services import run_inference_and_build_steps

from transformers import AutoModelForCausalLM, BitsAndBytesConfig, AutoTokenizer

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

model = None
tokenizer = None


def get_model_and_tokenizer():
    global model, tokenizer

    if model is not None and tokenizer is not None:
        return model, tokenizer

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    if torch.cuda.is_available():
        try:
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
            return model, tokenizer
        except ValueError as exc:
            print(f"4-bit model load failed, falling back to fp16 auto device map: {exc}")

        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,
            device_map="auto",
        )
        return model, tokenizer

    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
    return model, tokenizer



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
    run_id: str = None
):
    loaded_model, loaded_tokenizer = get_model_and_tokenizer()

    def save_step_callback(step_dict):
        if run_id:
            try:
                with Session(engine) as session:
                    run = session.get(ReasoningRun, run_id)
                    if run:
                        valid_types = {'hypothesis','lookup','calculation','correction','conclusion'}
                        raw_type = str(step_dict.get("type", "hypothesis")).lower()
                        type_val = raw_type if raw_type in valid_types else "hypothesis"
                        
                        valid_conf = {'high','medium','low'}
                        raw_conf = str(step_dict.get("confidence", "medium")).lower()
                        conf_val = raw_conf if raw_conf in valid_conf else "medium"

                        step = ReasoningStep(
                            run_id=run.id,
                            type=type_val,
                            confidence=conf_val,
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
        loaded_model,
        loaded_tokenizer,
        question,
        SYSTEM_PROMPT,
        step_callback=save_step_callback
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
        "steps": steps
    }
