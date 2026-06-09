from celery import Celery

from dotenv import find_dotenv, load_dotenv
import os

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

print("REDIS_URL =", REDIS_URL)


app = Celery(
    'tasks',
    broker = REDIS_URL,
    backend = REDIS_URL
)

@app.task
def add(x, y):
        return x + y