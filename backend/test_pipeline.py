from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi.testclient import TestClient

from database import get_db
from dependencies.auth import get_current_user
from main import app
from models.auth import AuthResponse, AuthenticatedUser
from routers import summarizer as summarizer_router
from services import auth_service, chatbot_service, summarizer_service


class FakeInsertResult:
    def __init__(self, inserted_id: str) -> None:
        self.inserted_id = inserted_id


class FakeCollection:
    def __init__(self, name: str) -> None:
        self.name = name
        self.records: list[dict[str, Any]] = []

    def insert_one(self, document: dict[str, Any]) -> FakeInsertResult:
        print(f"[DB:{self.name}] insert_one -> _id={document.get('_id')}")
        self.records.append(document)
        return FakeInsertResult(str(document.get("_id")))

    def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        print(f"[DB:{self.name}] find_one -> {query}")
        for record in reversed(self.records):
            if all(record.get(key) == value for key, value in query.items()):
                return record
        return None

    def update_one(self, query: dict[str, Any], update: dict[str, Any]) -> None:
        found = self.find_one(query)
        if found and "$set" in update:
            found.update(update["$set"])


class FakeDatabase:
    def __init__(self) -> None:
        self.users = FakeCollection("users")
        self.documents = FakeCollection("documents")
        self.chat_history = FakeCollection("chat_history")


def run_pipeline() -> None:
    print("=== Backend End-to-End Test Pipeline ===")

    fake_db = FakeDatabase()
    fake_user = AuthenticatedUser(
        _id=str(uuid4()),
        email="pipeline@example.com",
        google_id="google-pipeline-user",
        name="Pipeline User",
        picture=None,
        is_active=True,
        created_at=datetime.now(UTC),
        last_login_at=datetime.now(UTC),
    )
    fake_db.users.insert_one(fake_user.model_dump(by_alias=True))

    original_auth = auth_service.auth_service.authenticate_with_google
    original_pdf_extract = summarizer_router.extract_text_from_pdf
    original_summary = summarizer_service.summarizer_service.process_summarization
    original_chat_process = chatbot_service.process_query
    original_chat_documents = chatbot_service.db_client.documents
    original_chat_history = chatbot_service.db_client.chat_history
    original_vector_search = chatbot_service.vector_service.search_legal_docs
    original_llm = chatbot_service.llm_service.get_ai_response

    def fake_get_db() -> FakeDatabase:
        return fake_db

    def fake_get_current_user() -> AuthenticatedUser:
        return fake_user

    def fake_authenticate_with_google(_: str) -> AuthResponse:
        print("Auth working")
        print("User saved")
        return AuthResponse(access_token="pipeline-jwt-token", user=fake_user)

    def fake_process_summarization(db, user_id, text, source_type, filename=None):
        record = {
            "_id": str(uuid4()),
            "user_id": str(user_id),
            "original_text": text,
            "summarized_text": "This is a mocked summary.",
            "source_type": source_type,
            "filename": filename,
            "created_at": datetime.now(UTC),
        }
        db.documents.insert_one(record)
        print("Document saved")
        return record["summarized_text"]

    def fake_vector_search(query: str, k: int = 3):
        print(f"[Vector] search called with query={query!r}, k={k}")
        return []

    def fake_llm_response(prompt: str):
        print(f"[LLM] prompt length={len(prompt)}")
        return "Mocked chatbot answer."

    def traced_chat_process(*args, **kwargs):
        print("Chatbot working")
        return original_chat_process(*args, **kwargs)

    auth_service.auth_service.authenticate_with_google = fake_authenticate_with_google
    summarizer_service.summarizer_service.process_summarization = fake_process_summarization
    summarizer_router.extract_text_from_pdf = lambda _: "This is a mocked uploaded document."
    chatbot_service.vector_service.search_legal_docs = fake_vector_search
    chatbot_service.llm_service.get_ai_response = fake_llm_response
    chatbot_service.process_query = traced_chat_process
    chatbot_service.db_client.documents = fake_db.documents
    chatbot_service.db_client.chat_history = fake_db.chat_history

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_current_user] = fake_get_current_user

    try:
        client = TestClient(app)

        print("\n[1] Google auth")
        auth_response = client.post(
            "/api/auth/google",
            json={"id_token": "mock-google-id-token"},
        )
        print(auth_response.status_code, auth_response.json())

        print("\n[2] Upload + summarize document")
        upload_response = client.post(
            "/api/summarizer/upload/pdf",
            files={"file": ("demo.pdf", b"%PDF-1.4 fake pdf bytes", "application/pdf")},
        )
        print(upload_response.status_code, upload_response.json())

        saved_document = fake_db.documents.records[-1]
        document_id = saved_document["_id"]

        print("\n[3] General chatbot query")
        general_chat_response = client.post(
            "/api/chatbot/query",
            json={"query": "What is IPC Section 302?"},
        )
        print(general_chat_response.status_code, general_chat_response.json())

        print("\n[4] Document chatbot query")
        doc_chat_response = client.post(
            "/api/chatbot/query",
            json={
                "query": "Summarize this uploaded document for me.",
                "document_id": document_id,
            },
        )
        print(doc_chat_response.status_code, doc_chat_response.json())

        print("\n=== Final State ===")
        print(f"Users stored: {len(fake_db.users.records)}")
        print(f"Documents stored: {len(fake_db.documents.records)}")
        print(f"Chat records stored: {len(fake_db.chat_history.records)}")
    finally:
        auth_service.auth_service.authenticate_with_google = original_auth
        summarizer_router.extract_text_from_pdf = original_pdf_extract
        summarizer_service.summarizer_service.process_summarization = original_summary
        chatbot_service.vector_service.search_legal_docs = original_vector_search
        chatbot_service.llm_service.get_ai_response = original_llm
        chatbot_service.process_query = original_chat_process
        chatbot_service.db_client.documents = original_chat_documents
        chatbot_service.db_client.chat_history = original_chat_history
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


if __name__ == "__main__":
    run_pipeline()
