from pydantic import BaseModel, EmailStr,Field
from typing import Optional
from uuid import UUID, uuid4

class User(BaseModel):
    id:UUID = Field(default_factory=uuid4, alias="_id")
    email: EmailStr=Field(...,unique=True)
    google_id:str=Field(...,unique=True)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "email": "user@exapmle.com",
                "google_id": "google-oauth2|1234567890"
            }
        }