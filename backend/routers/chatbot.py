from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import UUID

from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser
from models.document import ChatHistoryResponse
from services import chatbot_service
from services.vector_service import vector_service

router = APIRouter()


class ChatQueryRequest(BaseModel):
    query: str
    document_id: str | None = None


class ChatQueryResponse(BaseModel):
    answer: str
    vector_index_ready: bool


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
        return {"answer": answer, "vector_index_ready": bool(vector_service.db)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/chat/history", response_model=list[ChatHistoryResponse])
async def get_chat_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    try:
        return chatbot_service.get_chat_history(UUID(current_user.id))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
