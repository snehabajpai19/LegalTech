from __future__ import annotations

from fastapi import APIRouter, Depends

from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser, AuthResponse, GoogleAuthRequest
from services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/google", response_model=AuthResponse)
def google_authenticate(payload: GoogleAuthRequest) -> AuthResponse:
    return auth_service.authenticate_with_google(payload.id_token)


@router.get("/me", response_model=AuthenticatedUser)
def get_me(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    return current_user
