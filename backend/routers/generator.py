from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser
from models.document_generator import (
    DocumentGenerationPayload,
    DocumentGenerationResult,
)
from models.document_template import (
    DocumentTemplate,
    DocumentTemplateCreate,
    DocumentTemplateUpdate,
)
from services.document_generator_service import DocumentGeneratorService
from services.template_service import TemplateService

router = APIRouter()

_template_service = TemplateService()
_generator_service = DocumentGeneratorService()


def require_template_manager(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    return current_user


@router.get("/api/templates", response_model=List[DocumentTemplate])
def list_templates(category: Optional[str] = None) -> List[DocumentTemplate]:
    return _template_service.list_templates(category)


@router.post(
    "/api/templates",
    response_model=DocumentTemplate,
    status_code=status.HTTP_201_CREATED,
)
def create_template(
    payload: DocumentTemplateCreate,
    _: AuthenticatedUser = Depends(require_template_manager),
) -> DocumentTemplate:
    return _template_service.create_template(payload)


@router.get("/api/templates/{template_id}", response_model=DocumentTemplate)
def get_template(template_id: UUID) -> DocumentTemplate:
    return _template_service.get_template(template_id)


@router.put("/api/templates/{template_id}", response_model=DocumentTemplate)
def update_template(
    template_id: UUID,
    payload: DocumentTemplateUpdate,
    _: AuthenticatedUser = Depends(require_template_manager),
) -> DocumentTemplate:
    return _template_service.update_template(template_id, payload)


@router.delete("/api/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: UUID,
    _: AuthenticatedUser = Depends(require_template_manager),
) -> None:
    _template_service.delete_template(template_id)


@router.post(
    "/api/generator/render",
    response_model=DocumentGenerationResult,
    status_code=status.HTTP_201_CREATED,
)
def render_document(
    payload: DocumentGenerationPayload,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DocumentGenerationResult:
    return _generator_service.generate(payload, user_id=UUID(current_user.id))
