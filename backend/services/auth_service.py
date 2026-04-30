from __future__ import annotations

import binascii
import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from pydantic import ValidationError

from config import settings
from database import db_client
from models.auth import AuthenticatedUser, AuthResponse, TokenPayload
from models.user import User

try:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token
except ImportError:  # pragma: no cover - import depends on optional package
    google_requests = None
    google_id_token = None


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


class AuthService:
    def __init__(self) -> None:
        self.users = db_client.users

    def _require_users_collection(self):
        if self.users is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB users collection is not available.",
            )
        return self.users

    def authenticate_with_google(self, google_token: str) -> AuthResponse:
        google_user = self._verify_google_token(google_token)
        user = self._upsert_google_user(google_user)
        access_token = self.create_access_token(str(user.id), user.email)
        return AuthResponse(access_token=access_token, user=self._serialize_user(user))

    def _verify_google_token(self, google_token: str) -> dict:
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GOOGLE_CLIENT_ID is not configured on the backend.",
            )
        if google_id_token is None or google_requests is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google auth dependencies are missing. Install 'google-auth'.",
            )

        try:
            return google_id_token.verify_oauth2_token(
                google_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google ID token.",
            ) from exc

    def _upsert_google_user(self, google_user: dict) -> User:
        users = self._require_users_collection()
        google_id = google_user.get("sub")
        email = google_user.get("email")
        if not google_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account data is incomplete.",
            )

        now = datetime.utcnow()
        existing = users.find_one(
            {
                "$or": [
                    {"google_id": google_id},
                    {"email": email},
                ]
            }
        )
        if existing:
            updates = {
                "email": email,
                "google_id": google_id,
                "name": google_user.get("name"),
                "picture": google_user.get("picture"),
                "last_login_at": now,
            }
            users.update_one({"_id": existing["_id"]}, {"$set": updates})
            existing.update(updates)
            return User(**existing)

        user = User(
            _id=uuid4(),
            email=email,
            google_id=google_id,
            name=google_user.get("name"),
            picture=google_user.get("picture"),
            created_at=now,
            last_login_at=now,
        )
        document = user.model_dump(by_alias=True)
        for key, value in list(document.items()):
            if isinstance(value, UUID):
                document[key] = str(value)
        users.insert_one(document)
        return User(**document)

    def create_access_token(self, user_id: str, email: str | None = None) -> str:
        if settings.JWT_ALGORITHM != "HS256":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Only HS256 JWT signing is currently supported.",
            )
        now = datetime.now(UTC)
        expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user_id,
            "email": email,
            "exp": int(expires_at.timestamp()),
        }

        header_segment = _b64url_encode(
            json.dumps({"alg": settings.JWT_ALGORITHM, "typ": "JWT"}).encode("utf-8")
        )
        payload_segment = _b64url_encode(json.dumps(payload).encode("utf-8"))
        signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
        signature = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        signature_segment = _b64url_encode(signature)
        return f"{header_segment}.{payload_segment}.{signature_segment}"

    def decode_access_token(self, token: str) -> TokenPayload:
        if settings.JWT_ALGORITHM != "HS256":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Only HS256 JWT signing is currently supported.",
            )
        try:
            header_segment, payload_segment, signature_segment = token.split(".")
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed access token.",
            ) from exc

        signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
        expected_signature = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        try:
            provided_signature = _b64url_decode(signature_segment)
        except (ValueError, binascii.Error) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed access token.",
            ) from exc
        if not hmac.compare_digest(expected_signature, provided_signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token signature.",
            )

        try:
            payload_data = json.loads(_b64url_decode(payload_segment))
            payload = TokenPayload(**payload_data)
        except (ValueError, binascii.Error, json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed access token.",
            ) from exc
        if payload.exp < int(datetime.now(UTC).timestamp()):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token has expired.",
            )
        return payload

    @staticmethod
    def _serialize_user(user: User) -> AuthenticatedUser:
        data = user.model_dump(by_alias=True)
        for key, value in list(data.items()):
            if isinstance(value, UUID):
                data[key] = str(value)
        return AuthenticatedUser(**data)


auth_service = AuthService()
