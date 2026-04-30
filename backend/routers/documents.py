from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser
from models.document import StoredDocument
from services.document_service import document_service

router = APIRouter()


@router.get("/api/documents", response_model=List[StoredDocument])
def list_documents(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[StoredDocument]:
    return document_service.list_documents(UUID(current_user.id))


@router.get("/api/documents/{document_id}", response_model=StoredDocument)
def get_document(
    document_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StoredDocument:
    return document_service.get_document(UUID(current_user.id), document_id)


@router.delete("/api/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> None:
    document_service.delete_document(UUID(current_user.id), document_id)
