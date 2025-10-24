from pymongo.database import Database
from models.document import ChatMessage
from database import get_db_client
from uuid import UUID, uuid4
from datetime import datetime

def process_query(db:Database,user_id:UUID,query:str):
    # Placeholder logic for processing the chatbot query
    # In a real implementation, this would involve NLP models or external APIs

    # For demonstration, we just echo the query back with a simple response
    response = f"Return fake Answer : Echoing your query: '{query}'"

    # Store the chat message in the database
    chat_message = ChatMessage(
        document_id=uuid4(),  # You may want to pass the actual document_id
        message=query,
        timestamp=datetime.utcnow()
    )
    data = chat_message.model_dump(by_alias=True)
    # Convert all UUID fields to strings for MongoDB compatibility
    for k, v in data.items():
        if isinstance(v, UUID):
            data[k] = str(v)
    db.chat_history.insert_one(data)
    return response