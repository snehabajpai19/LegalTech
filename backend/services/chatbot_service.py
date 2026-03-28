from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status

from database import db_client
from models.document import ChatMessage
from services.llm_service import llm_service
from services.vector_service import vector_service


def _build_general_prompt(query: str) -> str:
    try:
        relevant_docs = vector_service.search_legal_docs(query, k=3)
        context_text = "\n\n".join(doc.page_content for doc in relevant_docs)
    except Exception:
        context_text = ""
    return (
        "You are a helpful legal assistant. Answer the user's question clearly and "
        "practically. Use the legal context if it helps.\n\n"
        f"Legal context:\n{context_text or 'No specific legal context retrieved.'}\n\n"
        f"Question:\n{query}"
    )


def _extract_document_text(document: dict) -> str:
    for field in ("generated_text", "original_text", "summarized_text"):
        value = document.get(field)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _build_document_prompt(query: str, document_text: str) -> str:
    retrieval_query = f"{query}\n\nRelevant document excerpt:\n{document_text[:1200]}"
    try:
        relevant_docs = vector_service.search_legal_docs(retrieval_query, k=3)
        legal_context = "\n\n".join(doc.page_content for doc in relevant_docs)
    except Exception:
        legal_context = ""
    return (
        "You are a legal assistant answering questions about a specific user document. "
        "Base the answer primarily on the document content below. Use the retrieved legal "
        "context if it helps interpret the document.\n\n"
        f"Retrieved legal context:\n{legal_context or 'No additional legal context retrieved.'}\n\n"
        f"Document content:\n{document_text}\n\n"
        f"Question:\n{query}"
    )


def _load_user_document(user_id: UUID, document_id: str) -> dict:
    if db_client.documents is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB document store is not available.",
        )

    document = db_client.documents.find_one({"_id": document_id, "user_id": str(user_id)})
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found for this user.",
        )
    return document


def _persist_document_chat(
    user_id: UUID,
    document_id: str,
    message: str,
    answer: str,
) -> None:
    if db_client.chat_history is None:
        return

    chat_entry = ChatMessage(
        user_id=user_id,
        document_id=document_id,
        message=message,
        answer=answer,
        mode="document",
        created_at=datetime.utcnow(),
        timestamp=datetime.utcnow(),
    )
    payload = chat_entry.model_dump(by_alias=True)
    for key, value in list(payload.items()):
        if isinstance(value, UUID):
            payload[key] = str(value)
    db_client.chat_history.insert_one(payload)


def process_query(user_id: UUID, query: str, document_id: str | None = None):
    cleaned_query = query.strip()
    if not cleaned_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must not be empty.",
        )

    if document_id:
        document = _load_user_document(user_id, document_id)
        document_text = _extract_document_text(document)
        if not document_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected document does not contain text for chatbot analysis.",
            )

        prompt = _build_document_prompt(cleaned_query, document_text)
    else:
        prompt = _build_general_prompt(cleaned_query)

    ai_answer = llm_service.get_ai_response(prompt)

    if document_id:
        _persist_document_chat(user_id, document_id, cleaned_query, ai_answer)
    return ai_answer
