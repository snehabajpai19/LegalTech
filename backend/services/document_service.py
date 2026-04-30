from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from pymongo.errors import PyMongoError

from database import db_client
from models.document import StoredDocument


class DocumentService:
    def __init__(self) -> None:
        self.collection = db_client.documents

    def _require_collection(self):
        if self.collection is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB documents collection is not available.",
            )
        return self.collection

    @staticmethod
    def _serialize(document: dict) -> StoredDocument:
        payload = dict(document)
        payload.setdefault("metadata", {})
        return StoredDocument(**payload)

    def list_documents(self, user_id: UUID) -> List[StoredDocument]:
        collection = self._require_collection()
        try:
            records = collection.find({"user_id": str(user_id)}).sort("created_at", -1)
            return [self._serialize(record) for record in records]
        except PyMongoError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB documents collection is not available.",
            ) from exc

    def get_document(self, user_id: UUID, document_id: UUID) -> StoredDocument:
        collection = self._require_collection()
        try:
            record = collection.find_one({"_id": str(document_id), "user_id": str(user_id)})
        except PyMongoError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB documents collection is not available.",
            ) from exc
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        return self._serialize(record)

    def delete_document(self, user_id: UUID, document_id: UUID) -> None:
        collection = self._require_collection()
        try:
            result = collection.delete_one({"_id": str(document_id), "user_id": str(user_id)})
        except PyMongoError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB documents collection is not available.",
            ) from exc
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )


document_service = DocumentService()
