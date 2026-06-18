import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DB_URL")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Executing test query...")
        conn.execute(text("SELECT * FROM reasoningrun LIMIT 1;"))
        print("Success.")
except Exception as e:
    print(f"Error: {e}")
