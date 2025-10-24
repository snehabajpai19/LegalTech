from fastapi import HTTPException
from fastapi import APIRouter,Depends
from pydantic import BaseModel
from pymongo.database import Database
from uuid import UUID   
from services import summarizer_service
from database import get_db



router = APIRouter()
class SummarizerRequest(BaseModel):
    text: str
    user_id: UUID  # will get later from Auth

class SummarizeResponse(BaseModel):
    summary: str
    
@router.post("/api/summarizer/upload", response_model=SummarizeResponse)
async def handle_file_upload(request: SummarizerRequest, db: Database = Depends(get_db)):
    try:
        summary=summarizer_service.summarize_text(
            db=db,
            user_id=request.user_id,
            text=request.text
        )
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))