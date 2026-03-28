from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.vector_service import vector_service

router = APIRouter()


class LegalSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    top_k: int = Field(default=10, ge=1, le=50)


class LegalSearchHit(BaseModel):
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    distance: float = Field(
        ...,
        description="Vector distance (lower is typically more similar).",
    )


class LegalSearchResponse(BaseModel):
    query: str
    results: List[LegalSearchHit]
    index_ready: bool


@router.post("/api/search/legal", response_model=LegalSearchResponse)
def legal_semantic_search(body: LegalSearchRequest) -> LegalSearchResponse:
    q = body.query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    if not vector_service.db:
        return LegalSearchResponse(query=q, results=[], index_ready=False)

    pairs = vector_service.search_legal_docs_with_scores(q, k=body.top_k)
    hits: List[LegalSearchHit] = []
    for doc, dist in pairs:
        meta = dict(doc.metadata) if doc.metadata else {}
        hits.append(
            LegalSearchHit(
                content=doc.page_content,
                metadata=meta,
                distance=float(dist),
            )
        )

    return LegalSearchResponse(query=q, results=hits, index_ready=True)