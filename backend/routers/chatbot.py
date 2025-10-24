

from fastapi import HTTPException

from fastapi import APIRouter,Depends
from pydantic import BaseModel
from pymongo.database import Database
from uuid import UUID
from services import chatbot_service
from database import get_db
router = APIRouter()

class ChatQueryRequest(BaseModel):
    query:str
    user_id:UUID # willl get later from Auth

class ChatQueryResponse(BaseModel):
    answer:str


@router.post("/api/chatbot/query",response_model=ChatQueryResponse)
async def handle_chatbot_query(request: ChatQueryRequest, db: Database = Depends(get_db)): #This si Dependency Injectuion using db:dataabse
    try:
        answer = chatbot_service.process_query(
            db=db, 
            user_id=request.user_id, 
            query=request.query
        )
        return {"answer": answer}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))