from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TextStreamer
import torch
import torch.nn.functional as F
import re
import json
import logging

from llm.system_prompts import SYSTEM_PROMPT_1

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


MAX_STEPS          = 10      # hard cap on steps per question
MAX_CONTEXT_TOKENS = 28000   # leave      4k buffer below 32k window
MAX_NEW_TOKENS     = 200     # per step
MODEL_NAME         = "Qwen/Qwen2.5-3B-Instruct"

SYSTEM_PROMPT = SYSTEM_PROMPT_1


# ── helpers ────────────────────────────────────────────────────────────────────

def compute_entropy(token_scores: torch.Tensor) -> float:
    probs   = F.softmax(token_scores, dim=-1)
    entropy = -torch.sum(probs * torch.log(probs + 1e-9), dim=-1)
    return entropy.item()


def compute_top_alternatives(token_scores: torch.Tensor, tokenizer, k: int = 5) -> list:
    probs = F.softmax(token_scores, dim=-1)
    top_k = torch.topk(probs[0], k=k)
    return [
        {"token": tokenizer.decode([idx.item()]), "prob": round(p.item(), 4)}
        for idx, p in zip(top_k.indices, top_k.values)
    ]


def compute_chosen_prob(token_scores: torch.Tensor, chosen_token_id: int) -> float:
    probs = F.softmax(token_scores, dim=-1)
    return probs[0, chosen_token_id].item()


def count_tokens(tokenizer, message_history: list) -> int:
    """Count how many tokens the current history uses."""
    text = tokenizer.apply_chat_template(
        message_history, tokenize=False, add_generation_prompt=True
    )
    return len(tokenizer.encode(text))


def trim_history_if_needed(tokenizer, message_history: list) -> list:
    """
    If context is too long, remove oldest PLAN steps from history
    but always keep system prompt and original user question.
    """
    while count_tokens(tokenizer, message_history) > MAX_CONTEXT_TOKENS:
        # keep index 0 (system) and index 1 (user question)
        # remove index 2 (oldest assistant + user pair)
        if len(message_history) > 4:
            removed = message_history.pop(2)   # oldest assistant message
            if len(message_history) > 2:
                message_history.pop(2)         # its paired "Continue" user message
            logger.warning("Context trimmed — removed oldest step to stay within window")
        else:
            logger.warning("Context too long but cannot trim further")
            break
    return message_history


def build_step_metrics(
    step_type:          str,
    step_content:       str,
    token_entropies:    list,
    chosen_token_probs: list,
    top_alternatives:   list,
    step_index:         int,
) -> dict:

    n = len(token_entropies)

    if n > 0:
        ent_mean = sum(token_entropies) / n  # Average uncertainity across step
        ent_min  = min(token_entropies)  # Most confident single token
        ent_max  = max(token_entropies) # Most uncertain single token
        ent_var  = sum((x - ent_mean) ** 2 for x in token_entropies) / n # How spiky was the uncertainity
        avg_prob = sum(chosen_token_probs) / n #Average commmitment to chose the tokens
    else:
        ent_mean = ent_min = ent_max = ent_var = avg_prob = 0.0

    if ent_mean < 0.2:
        confidence = "high"
    elif ent_mean < 0.5:
        confidence = "medium"
    else:
        confidence = "low"

    correction_keywords = ["wait", "actually", "correction", "no,", "wrong", "instead"]
    is_correction = any(kw in step_content.lower() for kw in correction_keywords)

    return {
        "id":               step_index,
        "type":             step_type,
        "label":            step_content[:40],
        "content":          step_content,
        "depends_on":       json.dumps(list(range(1, step_index))),
        "confidence":       confidence,
        "entropy":          round(ent_mean, 4),
        "entropy_min":      round(ent_min,  4),
        "entropy_max":      round(ent_max,  4),
        "entropy_var":      round(ent_var,  4),
        "token_count":      n,
        "avg_chosen_prob":  round(avg_prob, 4),
        "is_correction":    is_correction,
        "top_alternatives": json.dumps(top_alternatives),
        "decoding":         "greedy",
    }




def generate_one_step(model, tokenizer, message_history: list) -> tuple:
    """Generate exactly one JSON step. Returns metrics + parsed result."""

    # check context before generating
    current_tokens = count_tokens(tokenizer, message_history)
    logger.info(f"Context size: {current_tokens} / {MAX_CONTEXT_TOKENS} tokens")

    if current_tokens > MAX_CONTEXT_TOKENS:
        logger.error("Context exceeded limit even after trimming. Aborting step.")
        return None, [], [], [], ""

    text = tokenizer.apply_chat_template(
        message_history, tokenize=False, add_generation_prompt=True
    )
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
    input_len    = model_inputs.input_ids.shape[1]

    outputs = model.generate(
        **model_inputs,
        max_new_tokens=MAX_NEW_TOKENS,
        return_dict_in_generate=True,
        output_scores=True,
        do_sample=False,   
        temperature = None, 
        top_p=None,
        top_k=None,                     
        pad_token_id=tokenizer.eos_token_id,
    )

    generated_ids = outputs.sequences[0][input_len:]
    raw_text      = tokenizer.decode(generated_ids, skip_special_tokens=True)

    token_entropies    = []
    chosen_token_probs = []
    top_alternatives   = []

    for i, token_scores in enumerate(outputs.scores):
        if i >= len(generated_ids):
            break
        chosen_id = generated_ids[i].item()
        token_entropies.append(compute_entropy(token_scores))
        chosen_token_probs.append(compute_chosen_prob(token_scores, chosen_id))
        if i == 0:
            top_alternatives = compute_top_alternatives(token_scores, tokenizer)

    # parse JSON from raw output
    try:
        json_match = re.search(r'\{.*?\}', raw_text, re.DOTALL)
        parsed     = json.loads(json_match.group()) if json_match else None
    except json.JSONDecodeError:
        parsed = None

    return parsed, token_entropies, chosen_token_probs, top_alternatives, raw_text




def run_inference_and_build_steps(
    model,
    tokenizer,
    question: str,
    system_prompt: str,
    step_callback=None
) -> tuple:
    """
    Step-by-step inference loop.
    Returns (final_answer: str, steps: list[dict])
    """

    message_history = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": question},
]

    steps        = []
    step_index   = 1
    final_answer = ""

    logger.info(f"Starting inference for: {question}")

    while True:

        # hard cap on steps
        if step_index > MAX_STEPS:
            logger.warning(f"Max steps ({MAX_STEPS}) reached. Forcing OUTPUT.")
            message_history.append({
                "role":    "user",
                "content": "You have reached the maximum steps. Output your final answer now."
            })

        # trim context if growing too large
        message_history = trim_history_if_needed(tokenizer, message_history)

        # generate one step
        parsed, token_entropies, chosen_token_probs, top_alternatives, raw_text = \
            generate_one_step(model, tokenizer, message_history)

        # parse failure
        if parsed is None:
            logger.error(f"Parse failed. Raw output: {raw_text[:100]}")
            break

        step_kind = parsed.get("step")
        content   = parsed.get("content", "").strip()

        # append model response to history
        message_history.append({"role": "assistant", "content": raw_text})

        if step_kind == "PLAN":
            step_type = parsed.get("type", "hypothesis")

            logger.info(f"Step {step_index} [{step_type}]: {content[:60]}")

            step_data = build_step_metrics(
                step_type          = step_type,
                step_content       = content,
                token_entropies    = token_entropies,
                chosen_token_probs = chosen_token_probs,
                top_alternatives   = top_alternatives,
                step_index         = step_index,
            )
            steps.append(step_data)
            if step_callback:
                step_callback(step_data)
            step_index += 1

            # ask model for next step
            message_history.append({
                "role":    "user",
                "content": "Continue to the next reasoning step."
            })

        elif step_kind == "OUTPUT":
            final_answer = content
            logger.info(f"Final answer: {final_answer}")
            
            step_data = build_step_metrics(
                step_type          = "conclusion",
                step_content       = content,
                token_entropies    = token_entropies,
                chosen_token_probs = chosen_token_probs,
                top_alternatives   = top_alternatives,
                step_index         = step_index,
            )
            steps.append(step_data)
            if step_callback:
                step_callback(step_data)
                
            break

        else:
       
            logger.warning(f"Unexpected step kind: {step_kind}. Asking model to continue.")
            message_history.append({
                "role":    "user",
                "content": "Continue to the next reasoning step."
            })

    return final_answer, steps




