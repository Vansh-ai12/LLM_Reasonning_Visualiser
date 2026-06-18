import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import PayloadSchemaType

load_dotenv()
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

try:
    client.create_payload_index(
        collection_name="Memory",
        field_name="user_id",
        field_schema=PayloadSchemaType.KEYWORD,
    )
    print("Created index on user_id")
except Exception as e:
    print(f"Error creating index: {e}")

