import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DB_URL")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Checking tables...")
        # Check if user_id exists in reasoningrun
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='reasoningrun' AND column_name='user_id'")).fetchone()
        
        if not res:
            print("user_id column is missing! Adding it...")
            conn.execute(text("ALTER TABLE reasoningrun ADD COLUMN user_id UUID;"))
            
            # Since user_id shouldn't be null, we might need to populate it. 
            # But just adding it is the first step.
            conn.commit()
            print("user_id column added.")
        
        # Check if cluster_id still exists
        res_c = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='reasoningrun' AND column_name='cluster_id'")).fetchone()
        
        if res_c:
            print("cluster_id column exists! Dropping it...")
            conn.execute(text("ALTER TABLE reasoningrun DROP COLUMN cluster_id;"))
            conn.commit()
            print("cluster_id column dropped.")
            
        print("Done.")
except Exception as e:
    print(f"Error: {e}")
