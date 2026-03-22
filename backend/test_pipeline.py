# backend/test_pipeline.py
from uuid import UUID

from database import get_db_client
from services.chatbot_service import DEMO_USER_ID, process_query


def test_full_chatbot_flow():
    print("Starting Full Pipeline Test...")

    db = get_db_client()

    test_query = "What are the legal consequences of theft under Indian Law?"
    fake_user_uuid = UUID(DEMO_USER_ID)

    try:
        print(f"User Query: {test_query}")

        response = process_query(db, fake_user_uuid, test_query)

        print("\n--- AI RESPONSE ---")
        print(response)
        print("-------------------\n")

        print("Verifying MongoDB save...")
        saved_doc = db.chat_history.find_one({"_id": DEMO_USER_ID})

        if saved_doc:
            print("SUCCESS: Data found in MongoDB!")
            print(f"Saved Answer Snippet: {saved_doc['answer'][:50]}...")
        else:
            print("ERROR: Data was NOT saved to MongoDB.")

    except Exception as e:
        print(f"PIPELINE CRASHED: {e}")
    finally:
        if db and getattr(db, "client", None):
            db.client.close()


if __name__ == "__main__":
    test_full_chatbot_flow()
