from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from pymongo import ReturnDocument

from database import db_client
from models.document_template import (
    DocumentTemplate,
    DocumentTemplateCreate,
    DocumentTemplateUpdate,
)


class TemplateService:
    """Business logic around creating and managing legal document templates."""

    def __init__(self):
        self.collection = db_client.db.document_templates

    @staticmethod
    def _serialize(template_doc: dict) -> DocumentTemplate:
        """Convert Mongo document to Pydantic schema."""
        # Ensure timestamps exist
        template_doc.setdefault("created_at", datetime.utcnow())
        template_doc.setdefault("updated_at", datetime.utcnow())
        return DocumentTemplate(**template_doc)

    def list_templates(self, category: Optional[str] = None) -> List[DocumentTemplate]:
        query = {"category": category} if category else {}
        results = []
        for doc in self.collection.find(query):
            results.append(self._serialize(doc))
        return results

    def get_template(self, template_id: UUID) -> DocumentTemplate:
        doc = self.collection.find_one({"_id": str(template_id)})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )
        return self._serialize(doc)

    def create_template(self, payload: DocumentTemplateCreate) -> DocumentTemplate:
        template_id = uuid4()
        template_doc = payload.model_dump()
        template_doc.update(
            {
                "_id": str(template_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )
        self.collection.insert_one(template_doc)
        return self._serialize(template_doc)

    def update_template(
        self, template_id: UUID, payload: DocumentTemplateUpdate
    ) -> DocumentTemplate:
        update_data = {
            k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None
        }
        if not update_data:
            return self.get_template(template_id)

        update_data["updated_at"] = datetime.utcnow()

        result = self.collection.find_one_and_update(
            {"_id": str(template_id)},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER,
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )
        return self._serialize(result)

    def delete_template(self, template_id: UUID) -> None:
        delete_result = self.collection.delete_one({"_id": str(template_id)})
        if delete_result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )
