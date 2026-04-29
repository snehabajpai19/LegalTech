from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import UUID

from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser
from services import chatbot_service

router = APIRouter()


class ChatQueryRequest(BaseModel):
    query: str
    document_id: str | None = None


class ChatQueryResponse(BaseModel):
    answer: str


@router.post("/api/chatbot/query", response_model=ChatQueryResponse)
async def handle_chatbot_query(
    request: ChatQueryRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    try:
        answer = chatbot_service.process_query(
            user_id=UUID(current_user.id),
            query=request.query,
            document_id=request.document_id,
        )
        return {"answer": answer}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
