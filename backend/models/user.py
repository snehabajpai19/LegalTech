from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field

class User(BaseModel):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    email: EmailStr = Field(..., unique=True)
    google_id: str = Field(..., unique=True)
    name: str | None = None
    picture: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "email": "user@exapmle.com",
                "google_id": "1234567890",
                "name": "Priyansh Tiwari",
                "picture": "https://lh3.googleusercontent.com/a/sample-photo",
            }
        }
