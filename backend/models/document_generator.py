from __future__ import annotations

from datetime import datetime
from typing import Any, Dict
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentGenerationPayload(BaseModel):
    template_id: UUID
    user_id: UUID
    inputs: Dict[str, Any] = Field(
        default_factory=dict,
        description="Key-value pairs that will be merged into the template context.",
    )
    output_format: str = Field(
        default="text",
        description="Requested output format (text, pdf, docx). Currently informational only.",
    )


class DocumentGenerationResult(BaseModel):
    document_id: str
    template_id: str
    template_name: str
    template_version: str
    generated_text: str
    generated_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)
