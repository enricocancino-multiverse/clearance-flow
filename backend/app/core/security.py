"""
Security utilities: JWT handling, password hashing, authentication.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Union

from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import get_settings

settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=settings.BCRYPT_ROUNDS)


class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str  # account_id (UUID)
    role: str
    exp: int
    iat: int
    type: str = "access"  # "access" or "refresh"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a new JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = TokenPayload(
        sub=subject,
        role=role,
        exp=int(expire.timestamp()),
        iat=int(datetime.now(timezone.utc).timestamp()),
        type="access",
    )
    return jwt.encode(to_encode.model_dump(), settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str, role: str) -> str:
    """Create a new JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = TokenPayload(
        sub=subject,
        role=role,
        exp=int(expire.timestamp()),
        iat=int(datetime.now(timezone.utc).timestamp()),
        type="refresh",
    )
    return jwt.encode(to_encode.model_dump(), settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_reset_token(subject: str, role: str = "reset") -> str:
    """Create a JWT reset token for local dev-only password recovery."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)

    to_encode = TokenPayload(
        sub=subject,
        role=role,
        exp=int(expire.timestamp()),
        iat=int(datetime.now(timezone.utc).timestamp()),
        type="reset",
    )
    return jwt.encode(to_encode.model_dump(), settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> TokenPayload:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")


def decode_reset_token(token: str) -> TokenPayload:
    """Decode a password reset token and enforce reset-only usage."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        decoded = TokenPayload(**payload)
        if decoded.type != "reset":
            raise ValueError("Invalid token type")
        return decoded
    except jwt.ExpiredSignatureError as exc:
        raise ValueError("Token has expired") from exc
    except jwt.JWTError as exc:
        raise ValueError(f"Invalid token: {str(exc)}") from exc


def create_token_pair(subject: str, role: str) -> tuple[str, str]:
    """Create both access and refresh tokens."""
    access_token = create_access_token(subject, role)
    refresh_token = create_refresh_token(subject, role)
    return access_token, refresh_token