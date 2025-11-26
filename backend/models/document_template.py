from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class TemplateField(BaseModel):
    """Represents a single input required by a legal document template."""

    name: str = Field(..., description="Unique identifier for the field")
    label: str = Field(..., description="Human readable label")
    type: str = Field(
        ...,
        description="Input type (text, textarea, number, date, select, etc.)",
    )
    required: bool = Field(default=True)
    placeholder: Optional[str] = None
    description: Optional[str] = None
    options: Optional[List[str]] = None
    is_pii: bool = Field(
        default=False,
        description="Marks whether this field generally captures personally identifiable information.",
    )


class DocumentTemplateBase(BaseModel):
    """Shared attributes between the create/update/read schemas."""

    name: str
    description: str
    category: str
    fields: List[TemplateField]
    template_text: str = Field(
        ...,
        description="Jinja2 template string that will be rendered to create the document output.",
    )
    version: str = Field(default="1.0.0")


class DocumentTemplate(DocumentTemplateBase):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "7f7e2b98-63b8-4a49-9e3c-8a9d3690d7b3",
                "name": "FIR - Theft",
                "description": "Base template for filing an FIR for theft incidents",
                "category": "FIR",
                "version": "1.0.0",
                "fields": [
                    {
                        "name": "complainant_name",
                        "label": "Complainant Name",
                        "type": "text",
                        "required": True,
                        "is_pii": True,
                    }
                ],
                "template_text": "FIRST INFORMATION REPORT ...",
            }
        }


class DocumentTemplateCreate(DocumentTemplateBase):
    pass


class DocumentTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    fields: Optional[List[TemplateField]] = None
    template_text: Optional[str] = None
    version: Optional[str] = None

