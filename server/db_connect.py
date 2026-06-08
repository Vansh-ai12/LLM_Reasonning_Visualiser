from sqlmodel import create_engine, Session
from fastapi import HTTPException
from dotenv import load_dotenv
import os
load_dotenv()

DATABASE_URL = os.getenv("DB_URL")

engine = create_engine( 
    DATABASE_URL,
    echo=True
)
    
def get_session():
    session = Session(engine)

    try:
        yield session

    except Exception as e:
        session.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database Error: {str(e)}"
        )

    finally:
        session.close()