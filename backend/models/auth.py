from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., min_length=1)


class AuthenticatedUser(BaseModel):
    id: str = Field(alias="_id")
    email: str
    google_id: str
    name: str | None = None
    picture: str | None = None
    is_active: bool = True
    created_at: datetime
    last_login_at: datetime

    class Config:
        populate_by_name = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthenticatedUser


class TokenPayload(BaseModel):
    sub: str
    email: str | None = None
    exp: int
