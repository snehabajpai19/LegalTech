from pydantic import BaseModel, EmailStr, Field
from typing import Optional 
from uuid import UUID,uuid4
from datetime import datetime

class Document(BaseModel):
    id:UUID =Field(default_factory=uuid4,alias="_id")
    user_id:UUID=Field(...)
    created_at:datetime=Field(default_factory=datetime.utcnow)
    
    #For Summarizer
    original_text:Optional[str]=Field(None)
    summarized_text:Optional[str]=Field(None)

    #For Generator
    generated_text:Optional[str]=Field(None)

    class Config:
        populate_by_name=True
        json_schema_extra={
            "example":{
                "user_id":"550e8400-e29b-41d4-a716-446655440000",
                "original_text":"This is the original document text that needs to be summarized.",
                "summarized_text":"This is the summarized version of the document.",
                "generated_text":"This is the text generated based on the document."
            }
        }

#Chat Message

class ChatMessage(BaseModel):
    id:UUID=Field(default_factory=uuid4,alias="_id")
    document_id:UUID=Field(...)
    created_at:datetime=Field(default_factory=datetime.utcnow)
    message: str=Field(...)
    timestamp:datetime=Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name=True
        json_schema_extra={
            "example":{
                "document_id":"660e8400-e29b-41d4-a716-446655440000",
                "sender":"user",
                "message":"What is the summary of this document?"
            }
        }