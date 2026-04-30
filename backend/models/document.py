from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Document(BaseModel):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    user_id: UUID = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # For Summarizer
    original_text: Optional[str] = Field(None)
    summarized_text: Optional[str] = Field(None)

    # For Generator
    generated_text: Optional[str] = Field(None)
    template_id: Optional[str] = Field(None)
    template_version: Optional[str] = Field(None)
    inputs_hash: Optional[str] = Field(
        None, description="Hash of user inputs used for the generated document"
    )
    metadata: Optional[dict] = Field(
        default_factory=dict,
        description="Additional metadata such as AI suggestions or audit info",
    )

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "original_text": "This is the original document text that needs to be summarized.",
                "summarized_text": "This is the summarized version of the document.",
                "generated_text": "This is the text generated based on the document.",
            }
        }


class StoredDocument(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    original_text: Optional[str] = None
    summarized_text: Optional[str] = None
    generated_text: Optional[str] = None
    template_id: Optional[str] = None
    template_version: Optional[str] = None
    inputs_hash: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    source_type: Optional[str] = None
    filename: Optional[str] = None
    retrieved_context_count: Optional[int] = None

    class Config:
        populate_by_name = True


class DocumentSummaryRecord(BaseModel):
    document_id: str
    summary: str


class DocumentSummaryResponse(BaseModel):
    document_id: str
    summary: str
    filename: Optional[str] = None
    source_type: str
    vector_index_ready: bool

#Chat Message

class ChatMessage(BaseModel):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    user_id: UUID = Field(...)
    document_id: Optional[str] = Field(None)
    message: str = Field(...)
    answer: str = Field(...)
    mode: str = Field(default="general")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "document_id": "660e8400-e29b-41d4-a716-446655440000",
                "message": "What is the summary of this document?",
                "answer": "Clause 4 focuses on payment obligations.",
                "mode": "document",
            }
        }


class ChatHistoryResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    document_id: Optional[str] = None
    message: str
    answer: str
    mode: str
    created_at: datetime
    timestamp: datetime

    class Config:
        populate_by_name = True
