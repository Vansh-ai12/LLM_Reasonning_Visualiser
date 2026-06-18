import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from qdrant_client.http.exceptions import ApiException

load_dotenv()
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
query_vector = [0.1] * 384

try:
    results = client.query_points(
        collection_name="Memory",
        query=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value="test-user-id")
                )
            ]
        ),
        limit=5
    )
    print("Success")
except ApiException as e:
    print(f"ApiException! Status: {e.status}")
    print(f"Reason: {e.reason}")
    if hasattr(e, 'body'):
        print(f"Body: {e.body}")
except Exception as e:
    print(f"Other Error: {e}")
