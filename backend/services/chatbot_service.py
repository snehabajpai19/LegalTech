# backend/services/chatbot_service.py
from pymongo.database import Database
from uuid import UUID
from datetime import datetime
from services.vector_service import vector_service
from services.llm_service import llm_service
from models.document import ChatMessage

# --- HARDCODED DEMO DATA ---
DEMO_USER_ID = "fe7b6cf4-aa6b-465c-b388-82e3e1d74f79"
DEMO_DOC_ID = "aad772b3-ed46-4384-9846-cfa72a63dc95"
FIXED_TIMESTAMP = "2025-10-24T19:16:34.912+00:00"

def process_query(db: Database, user_id: UUID, query: str):
    """
    RAG Pipeline with Hardcoded Auth for Demo
    """
    # 1. RETRIEVE
    relevant_docs = vector_service.search_legal_docs(query, k=3)
    context_text = "\n\n".join([doc.page_content for doc in relevant_docs])

    # 2. GENERATE
    prompt = f"Context: {context_text}\n\nQuestion: {query}" # Simplified for brevity
    ai_answer = llm_service.get_ai_response(prompt)

    # 3. PERSIST (Using Hardcoded Values)
    chat_entry = {
        "_id": DEMO_USER_ID, # Hardcoded User ID
        "document_id": DEMO_DOC_ID, # Hardcoded Document ID
        "message": query,
        "answer": ai_answer,
        "timestamp": datetime.fromisoformat(FIXED_TIMESTAMP.replace("+00:00", "")),
        "created_at": datetime.utcnow()
    }

    # Save to MongoDB
    db.chat_history.update_one(
        {"_id": DEMO_USER_ID}, 
        {"$set": chat_entry}, 
        upsert=True
    )
    
    return ai_answer

def get_dummy_chat_history():
    """
    Returns the exact dummy structure you requested for testing the frontend.
    """
    return [
        {
            "_id": DEMO_USER_ID,
            "document_id": DEMO_DOC_ID,
            "created_at": FIXED_TIMESTAMP,
            "message": "What is the punishment for theft?",
            "answer": "Under Section 379 of the IPC, theft is punishable with up to 3 years of imprisonment.",
            "timestamp": FIXED_TIMESTAMP
        }
    ]