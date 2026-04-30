from datetime import datetime
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from pymongo.errors import PyMongoError
from pymongo.database import Database

from models.document import DocumentSummaryRecord
from services.llm_service import llm_service
from services.vector_service import vector_service


class SummarizerService:
    @staticmethod
    def process_summarization(
        db: Database,
        user_id: UUID,
        text: str,
        source_type: str,
        filename: str | None = None,
    ) -> DocumentSummaryRecord:
        document_text = text.strip()
        if not document_text:
            raise ValueError("Document text is empty.")

        if db is None or getattr(db, "documents", None) is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB documents collection is not available.",
            )

        search_query = document_text[:500]
        try:
            related_laws = vector_service.search_legal_docs(search_query, k=3)
        except Exception:
            related_laws = []
        legal_context = "\n\n".join(doc.page_content for doc in related_laws)

        prompt = f"""
ROLE:
You are a legal translator for common citizens. Your job is to explain a legal document
to someone with no legal background.

LEGAL REFERENCE (From vector database):
{legal_context}

DOCUMENT TO SUMMARIZE:
{document_text}

INSTRUCTIONS:
1. Explain the core purpose in 1 sentence.
2. Break down the 3 most important points.
3. Explain any difficult legal language in simple words.
4. Keep the tone clear and practical.
5. Stay within 200 words.
"""

        summary = llm_service.get_ai_response(prompt)
        document_id = str(uuid4())

        try:
            db.documents.insert_one(
                {
                    "_id": document_id,
                    "user_id": str(user_id),
                    "original_text": document_text,
                    "summarized_text": summary,
                    "source_type": source_type,
                    "filename": filename,
                    "retrieved_context_count": len(related_laws),
                    "created_at": datetime.utcnow(),
                }
            )
        except PyMongoError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB documents collection is not available.",
            ) from exc

        return DocumentSummaryRecord(document_id=document_id, summary=summary)


summarizer_service = SummarizerService()
