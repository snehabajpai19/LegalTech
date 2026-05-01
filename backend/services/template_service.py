from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from jinja2 import Environment, TemplateSyntaxError, meta
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from database import db_client
from models.document_template import (
    DocumentTemplate,
    DocumentTemplateCreate,
    DocumentTemplateUpdate,
    TemplateField,
)


SYSTEM_TEMPLATE_DEFINITIONS = [
    DocumentTemplateCreate(
        name="FIR",
        description="Standard first information report template for reporting an incident.",
        category="FIR",
        version="1.0.0",
        fields=[
            TemplateField(name="complainant_name", label="Complainant Name", type="text", is_pii=True),
            TemplateField(name="police_station", label="Police Station", type="text"),
            TemplateField(name="incident_date", label="Incident Date", type="date"),
            TemplateField(name="incident_place", label="Incident Place", type="text"),
            TemplateField(name="incident_details", label="Incident Details", type="textarea"),
        ],
        template_text=(
            "<h1>First Information Report</h1>"
            "<p><strong>Date:</strong> {{ now().strftime('%Y-%m-%d') }}</p>"
            "<p><strong>To,</strong><br>The Station House Officer<br>{{ police_station }}</p>"
            "<p>I, {{ complainant_name }}, request registration of an FIR for an incident "
            "that occurred on {{ incident_date }} at {{ incident_place }}.</p>"
            "<h2>Incident Details</h2><p>{{ incident_details }}</p>"
            "<p>I request you to take necessary legal action.</p>"
            "<p>Sincerely,<br>{{ complainant_name }}</p>"
        ),
    ),
    DocumentTemplateCreate(
        name="Affidavit",
        description="General sworn affidavit template.",
        category="Affidavit",
        version="1.0.0",
        fields=[
            TemplateField(name="deponent_name", label="Deponent Name", type="text", is_pii=True),
            TemplateField(name="deponent_address", label="Address", type="textarea", is_pii=True),
            TemplateField(name="statement", label="Statement", type="textarea"),
            TemplateField(name="place", label="Place", type="text"),
        ],
        template_text=(
            "<h1>Affidavit</h1>"
            "<p>I, {{ deponent_name }}, residing at {{ deponent_address }}, do hereby solemnly affirm and state as follows:</p>"
            "<p>{{ statement }}</p>"
            "<p>Verified at {{ place }} on {{ now().strftime('%Y-%m-%d') }}.</p>"
            "<p><strong>Deponent:</strong> {{ deponent_name }}</p>"
        ),
    ),
    DocumentTemplateCreate(
        name="Contract",
        description="Basic contract template between two parties.",
        category="Contract",
        version="1.0.0",
        fields=[
            TemplateField(name="party_a", label="Party A", type="text", is_pii=True),
            TemplateField(name="party_b", label="Party B", type="text", is_pii=True),
            TemplateField(name="effective_date", label="Effective Date", type="date"),
            TemplateField(name="scope", label="Scope of Work", type="textarea"),
            TemplateField(name="consideration", label="Consideration", type="text"),
        ],
        template_text=(
            "<h1>Contract</h1>"
            "<p>This Contract is entered into on {{ effective_date }} between {{ party_a }} and {{ party_b }}.</p>"
            "<h2>Scope</h2><p>{{ scope }}</p>"
            "<h2>Consideration</h2><p>{{ consideration }}</p>"
            "<p>The parties agree to act in good faith and comply with applicable law.</p>"
        ),
    ),
    DocumentTemplateCreate(
        name="Agreement",
        description="General purpose agreement template.",
        category="Agreement",
        version="1.0.0",
        fields=[
            TemplateField(name="first_party", label="First Party", type="text", is_pii=True),
            TemplateField(name="second_party", label="Second Party", type="text", is_pii=True),
            TemplateField(name="agreement_date", label="Agreement Date", type="date"),
            TemplateField(name="terms", label="Terms", type="textarea"),
        ],
        template_text=(
            "<h1>Agreement</h1>"
            "<p>This Agreement is made on {{ agreement_date }} between {{ first_party }} and {{ second_party }}.</p>"
            "<h2>Terms and Conditions</h2><p>{{ terms }}</p>"
            "<p>Signed by the parties on the date mentioned above.</p>"
        ),
    ),
    DocumentTemplateCreate(
        name="Complaint",
        description="Formal complaint template for legal or administrative submission.",
        category="Complaint",
        version="1.0.0",
        fields=[
            TemplateField(name="complainant_name", label="Complainant Name", type="text", is_pii=True),
            TemplateField(name="authority_name", label="Authority Name", type="text"),
            TemplateField(name="subject", label="Subject", type="text"),
            TemplateField(name="complaint_details", label="Complaint Details", type="textarea"),
            TemplateField(name="relief_requested", label="Relief Requested", type="textarea"),
        ],
        template_text=(
            "<h1>Complaint</h1>"
            "<p><strong>To:</strong> {{ authority_name }}</p>"
            "<p><strong>Subject:</strong> {{ subject }}</p>"
            "<p>I, {{ complainant_name }}, submit the following complaint:</p>"
            "<p>{{ complaint_details }}</p>"
            "<h2>Relief Requested</h2><p>{{ relief_requested }}</p>"
        ),
    ),
    DocumentTemplateCreate(
        name="Legal Notice",
        description="Formal legal notice template.",
        category="Legal Notice",
        version="1.0.0",
        fields=[
            TemplateField(name="sender_name", label="Sender Name", type="text", is_pii=True),
            TemplateField(name="recipient_name", label="Recipient Name", type="text", is_pii=True),
            TemplateField(name="notice_subject", label="Subject", type="text"),
            TemplateField(name="facts", label="Facts", type="textarea"),
            TemplateField(name="demand", label="Demand", type="textarea"),
        ],
        template_text=(
            "<h1>Legal Notice</h1>"
            "<p><strong>From:</strong> {{ sender_name }}<br><strong>To:</strong> {{ recipient_name }}</p>"
            "<p><strong>Subject:</strong> {{ notice_subject }}</p>"
            "<h2>Facts</h2><p>{{ facts }}</p>"
            "<h2>Demand</h2><p>{{ demand }}</p>"
            "<p>You are requested to comply within the legally prescribed period.</p>"
        ),
    ),
]


class TemplateService:
    """Business logic around creating and managing legal document templates."""

    TEMPLATE_HELPERS = {"now"}

    def __init__(self):
        self.collection = db_client.document_templates

    def _require_collection(self):
        if self.collection is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB document_templates collection is not available.",
            )
        return self.collection

    @staticmethod
    def _serialize(template_doc: dict) -> DocumentTemplate:
        """Convert Mongo document to Pydantic schema."""
        # Ensure timestamps exist
        template_doc.setdefault("created_at", datetime.utcnow())
        template_doc.setdefault("updated_at", datetime.utcnow())
        return DocumentTemplate(**template_doc)

    @classmethod
    def _validate_template_variables(cls, fields: List[Any], template_text: str) -> None:
        field_names = [
            field.get("name") if isinstance(field, dict) else field.name for field in fields
        ]
        duplicate_fields = sorted({name for name in field_names if field_names.count(name) > 1})
        if duplicate_fields:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate template fields: {', '.join(duplicate_fields)}",
            )

        try:
            parsed_template = Environment().parse(template_text)
        except TemplateSyntaxError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Template syntax error: {exc.message}",
            ) from exc

        variables = meta.find_undeclared_variables(parsed_template) - cls.TEMPLATE_HELPERS
        field_name_set = set(field_names)
        missing_fields = sorted(variables - field_name_set)
        unused_fields = sorted(field_name_set - variables)
        if missing_fields or unused_fields:
            details = []
            if missing_fields:
                details.append(f"variables without fields: {', '.join(missing_fields)}")
            if unused_fields:
                details.append(f"fields not used in template: {', '.join(unused_fields)}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Template fields must match template variables ({'; '.join(details)}).",
            )

    def list_templates(self, category: Optional[str] = None) -> List[DocumentTemplate]:
        collection = self._require_collection()
        query = {"category": category} if category else {}
        results = []
        for doc in collection.find(query):
            results.append(self._serialize(doc))
        return results

    def get_template(self, template_id: UUID) -> DocumentTemplate:
        collection = self._require_collection()
        doc = collection.find_one({"_id": str(template_id)})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )
        return self._serialize(doc)

    def create_template(self, payload: DocumentTemplateCreate) -> DocumentTemplate:
        collection = self._require_collection()
        self._validate_template_variables(payload.fields, payload.template_text)
        template_id = uuid4()
        template_doc = payload.model_dump()
        template_doc.update(
            {
                "_id": str(template_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )
        try:
            collection.insert_one(template_doc)
        except DuplicateKeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A template with this name already exists.",
            ) from exc
        return self._serialize(template_doc)

    def ensure_system_templates(self) -> None:
        collection = self._require_collection()
        for template in SYSTEM_TEMPLATE_DEFINITIONS:
            if collection.find_one({"name": template.name}):
                continue
            self._validate_template_variables(template.fields, template.template_text)
            now = datetime.utcnow()
            template_doc = template.model_dump()
            template_doc.update(
                {
                    "_id": str(uuid4()),
                    "is_system": True,
                    "user_id": None,
                    "created_at": now,
                    "updated_at": now,
                }
            )
            collection.insert_one(template_doc)

    def update_template(
        self, template_id: UUID, payload: DocumentTemplateUpdate
    ) -> DocumentTemplate:
        collection = self._require_collection()
        update_data = {
            k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None
        }
        if not update_data:
            return self.get_template(template_id)

        current_template = self.get_template(template_id)
        next_fields = update_data.get("fields", current_template.fields)
        next_template_text = update_data.get("template_text", current_template.template_text)
        self._validate_template_variables(next_fields, next_template_text)

        update_data["updated_at"] = datetime.utcnow()

        try:
            result = collection.find_one_and_update(
                {"_id": str(template_id)},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
        except DuplicateKeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A template with this name already exists.",
            ) from exc
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )
        return self._serialize(result)

    def delete_template(self, template_id: UUID) -> None:
        collection = self._require_collection()
        delete_result = collection.delete_one({"_id": str(template_id)})
        if delete_result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )
