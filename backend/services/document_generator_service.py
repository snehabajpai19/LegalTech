from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Tuple
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from jinja2 import Template

from database import db_client
from models.document import Document
from models.document_generator import (
    DocumentGenerationPayload,
    DocumentGenerationResult,
)
from models.document_template import DocumentTemplate, TemplateField
from services.template_service import TemplateService


class DocumentGeneratorService:
    """Encapsulates the workflow for rendering legal document templates."""

    PII_PATTERNS = {
        "AADHAAR": re.compile(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}\b"),
        "PAN": re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b"),
        "PHONE": re.compile(r"(\+?91[- ]?)?[6-9]\d{9}\b"),
        "EMAIL": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    }

    def __init__(self) -> None:
        self.template_service = TemplateService()
        self.documents_collection = db_client.documents
        self.pii_mapping_collection = db_client.db.pii_mappings

    def generate(self, payload: DocumentGenerationPayload) -> DocumentGenerationResult:
        template = self.template_service.get_template(payload.template_id)
        context = payload.inputs or {}
        self._validate_required_fields(template, context)

        redacted_context, placeholder_map = self._apply_field_redaction(
            template.fields, context
        )
        redacted_context, regex_map = self._apply_regex_redaction(redacted_context)
        placeholder_map.update(regex_map)

        mapping_id = (
            self._store_pii_mapping(payload.user_id, placeholder_map)
            if placeholder_map
            else None
        )

        rendered_text = self._render_template(template, context)
        inputs_hash = self._hash_inputs(context)

        document = self._persist_document(
            payload=payload,
            template=template,
            rendered_text=rendered_text,
            inputs_hash=inputs_hash,
            mapping_id=mapping_id,
            placeholders=list(placeholder_map.keys()),
        )

        return DocumentGenerationResult(
            document_id=str(document.id),
            template_id=str(template.id),
            template_name=template.name,
            template_version=template.version,
            generated_text=rendered_text,
            generated_at=document.created_at,
            metadata={
                "pii_mapping_id": mapping_id,
                "placeholder_keys": list(placeholder_map.keys()),
                "output_format": payload.output_format,
            },
        )

    @staticmethod
    def _validate_required_fields(
        template: DocumentTemplate, context: Dict[str, Any]
    ) -> None:
        missing = []
        for field in template.fields:
            if field.required and not str(context.get(field.name, "")).strip():
                missing.append(field.label or field.name)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Missing required fields: {', '.join(missing)}",
            )

    @staticmethod
    def _hash_inputs(context: Dict[str, Any]) -> str:
        serialised = json.dumps(context, sort_keys=True, default=str)
        return hashlib.sha256(serialised.encode("utf-8")).hexdigest()

    @staticmethod
    def _apply_field_redaction(
        fields: List[TemplateField], context: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, str]]:
        redacted = dict(context)
        mapping: Dict[str, str] = {}
        for field in fields:
            value = context.get(field.name)
            if field.is_pii and isinstance(value, str) and value.strip():
                placeholder = f"[[{field.name.upper()}]]"
                mapping[placeholder] = value
                redacted[field.name] = placeholder
        return redacted, mapping

    def _apply_regex_redaction(
        self, context: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, str]]:
        updated = dict(context)
        mapping: Dict[str, str] = {}
        for key, value in context.items():
            if isinstance(value, str):
                redacted_value = value
                for label, pattern in self.PII_PATTERNS.items():
                    for match_index, match in enumerate(pattern.findall(value), start=1):
                        placeholder = f"[[{label}_{match_index}]]"
                        mapping[placeholder] = match
                        redacted_value = redacted_value.replace(match, placeholder)
                updated[key] = redacted_value
        return updated, mapping

    def _store_pii_mapping(self, user_id: UUID, mapping: Dict[str, str]) -> str:
        mapping_id = str(uuid4())
        record = {
            "_id": mapping_id,
            "user_id": str(user_id),
            "placeholders": mapping,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=30),
        }
        self.pii_mapping_collection.insert_one(record)
        return mapping_id

    @staticmethod
    def _render_template(template: DocumentTemplate, context: Dict[str, Any]) -> str:
        try:
            jinja_template = Template(template.template_text)
            helpers = {"now": datetime.utcnow}
            return jinja_template.render(**context, **helpers)
        except Exception as exc:  # pragma: no cover - rare Jinja errors
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template rendering failed: {exc}",
            ) from exc

    def _persist_document(
        self,
        payload: DocumentGenerationPayload,
        template: DocumentTemplate,
        rendered_text: str,
        inputs_hash: str,
        mapping_id: str,
        placeholders: List[str],
    ) -> Document:
        document = Document(
            user_id=payload.user_id,
            generated_text=rendered_text,
            template_id=str(template.id),
            template_version=template.version,
            inputs_hash=inputs_hash,
            metadata={
                "pii_mapping_id": mapping_id,
                "placeholders": placeholders,
                "output_format": payload.output_format,
            },
        )
        data = document.model_dump(by_alias=True)
        for key, value in data.items():
            if isinstance(value, UUID):
                data[key] = str(value)
        self.documents_collection.insert_one(data)
        return document
