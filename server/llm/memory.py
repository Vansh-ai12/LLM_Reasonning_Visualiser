from dotenv import load_dotenv

from qdrant_client import QdrantClient

from qdrant_client.models import PointStruct

import os

from groq import Groq

import uuid
from datetime import datetime


from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F

import json

from qdrant_client.models import Filter, FieldCondition, MatchValue

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_KEY")

QDRANT_URL =  os.getenv("QDRANT_URL")

QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

from llm.system_prompts import MEMORY_MODEL_PROMPT

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')

model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')



def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0] #First element of model_output contains all token embeddings
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)


def createMemory(query: str, user_id: str):

    groqClient = Groq(
        api_key=GROQ_API_KEY
    )

    completion = groqClient.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": MEMORY_MODEL_PROMPT
            },
            {
                "role": "user",
                "content": query
            }
        ],
        temperature=0,
        max_completion_tokens=512,
        stream=False
    )

    response_text = completion.choices[0].message.content

    memory_json = json.loads(response_text)

    # Don't store useless messages
    if not memory_json.get("store"):
        return None

    memory_text = memory_json["memory"]
    memory_type = memory_json["memory_type"]

    # -----------------------------
    # Generate embedding
    # -----------------------------

    encoded_input = tokenizer(
        memory_text,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    with torch.no_grad():
        model_output = model(**encoded_input)

    sentence_embeddings = mean_pooling(
        model_output,
        encoded_input["attention_mask"]
    )

    sentence_embeddings = F.normalize(
        sentence_embeddings,
        p=2,
        dim=1
    )

    vector = sentence_embeddings[0].tolist()

    print(len(vector))

    # -----------------------------
    # Upsert to Qdrant
    # -----------------------------

    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload={
            "user_id": user_id,
            "memory_type": memory_type,
            "text": memory_text,
            "created_at": datetime.utcnow().isoformat()
        }
    )

    client.upsert(
        collection_name="Memory",
        points=[point]
    )

    return point.payload





def retrieveMemory(query: str, user_id):

    # Tokenize query
    encoded_query = tokenizer(
        query,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    # Generate token embeddings
    with torch.no_grad():
        model_output = model(**encoded_query)

    # Mean Pooling
    sentence_embeddings = mean_pooling(
        model_output,
        encoded_query["attention_mask"]
    )

    # Normalize Embeddings
    sentence_embeddings = F.normalize(
        sentence_embeddings,
        p=2,
        dim=1
    )

    # Convert tensor -> list
    query_vector = sentence_embeddings[0].tolist()
    print(len(query_vector))

    # Similarity Search + User Filter
    try:
        results = client.query_points(
        collection_name="Memory",
        query=query_vector,
        query_filter=Filter(
                must=[
                    FieldCondition(
                        key="user_id",
                        match=MatchValue(value=user_id)
                    )
                ]
            ),
            limit=5
        )
    except Exception as e:
        print("QDRANT ERROR:", e)
        print("USER ID:", user_id)
        print("VECTOR LENGTH:", len(query_vector))
        return []
        
    memories=[]
    for point in results.points:
        memories.append({
            "text": point.payload["text"],
            "memory_type": point.payload["memory_type"],
            "created_at": point.payload["created_at"],
            "score": point.score
        })

    return memories

