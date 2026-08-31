"""
Authentication schemas.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.account import UserRole


class LoginRequest(BaseModel):
    """Login request payload."""
    credential: str = Field(..., description="School ID or email")
    password: str = Field(..., min_length=1, description="Password")


class LoginResponse(BaseModel):
    """Login response with tokens and user info."""
    account: "AccountResponse"
    student: Optional["StudentResponse"] = None
    faculty: Optional["FacultyResponse"] = None
    token: str
    expires_at: datetime
    must_change_password: bool = False


class TokenRefreshRequest(BaseModel):
    """Token refresh request."""
    refresh_token: str


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccountResponse(BaseModel):
    """Account response schema."""
    account_id: UUID = Field(validation_alias="id", serialization_alias="account_id")
    email: str
    role: UserRole
    theme_preference: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    must_change_password: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountCreate(BaseModel):
    """Account creation schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.STUDENT
    school_id: Optional[str] = None
    department: Optional[str] = None
    year_level: Optional[int] = Field(None, ge=1, le=4)
    section: Optional[str] = None


class AccountUpdate(BaseModel):
    """Account update schema."""
    theme_preference: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    """Password change request."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class ForgotPasswordRequest(BaseModel):
    """Request a password reset for an existing account."""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Local dev-only password reset response."""
    message: str
    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    """Reset a password using a valid reset token."""
    token: str
    new_password: str = Field(..., min_length=8)


class ResetPasswordResponse(BaseModel):
    """Password reset confirmation."""
    message: str


# Forward references
from app.schemas.student import StudentResponse
from app.schemas.faculty import FacultyResponse

LoginResponse.model_rebuild()