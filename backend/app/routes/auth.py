"""
Authentication routes.
"""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_token_pair,
    decode_token,
    verify_password,
)
from app.models.account import Account, UserRole
from app.schemas.auth import (
    AccountResponse,
    LoginRequest,
    LoginResponse,
    TokenRefreshRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


def classify_credential(credential: str) -> tuple[UserRole, str]:
    """
    Classify credential to determine lookup field.
    Returns (role, field_name) where field_name is 'email' or 'school_id'.
    """
    val = credential.strip().lower()

    # Student ID patterns: YYYY-NNNNN or YYYY-STU-NNN
    if val.startswith(tuple(str(y) for y in range(2020, 2030))):
        if "-stu-" in val or val.count("-") >= 1:
            return UserRole.STUDENT, "school_id"

    # Superadmin detection
    if "admin" in val or val == "superadmin":
        return UserRole.SUPERADMIN, "email"

    # Faculty email pattern
    return UserRole.FACULTY, "email"


async def get_current_account(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> Account:
    """Get current authenticated account from JWT token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = auth_header.split(" ")[1]
    try:
        payload = decode_token(token)
        if payload.type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    result = await session.execute(select(Account).where(Account.id == payload.sub))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found",
        )

    return account


async def get_current_account_optional(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> Optional[Account]:
    """Get current account if authenticated, otherwise None."""
    try:
        return await get_current_account(request, session)
    except HTTPException:
        return None


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> LoginResponse:
    """
    Authenticate user with credential (school_id or email) and password.
    Returns JWT access token and user session info.
    """
    role, field = classify_credential(payload.credential)

    # Look up account by email or student/faculty school_id
    if field == "email":
        result = await session.execute(select(Account).where(Account.email == payload.credential.lower()))
    else:
        # Look up student or faculty by school_id, then get account
        from app.models.account import Student, Faculty

        if role == UserRole.STUDENT:
            result = await session.execute(
                select(Account)
                .join(Student, Account.id == Student.account_id)
                .where(Student.school_id == payload.credential.upper())
            )
        else:
            result = await session.execute(
                select(Account)
                .join(Faculty, Account.id == Faculty.account_id)
                .where(Faculty.school_id == payload.credential.upper())
            )

    account = result.scalar_one_or_none()

    if not account or not verify_password(payload.password, account.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Create token pair
    access_token, refresh_token = create_token_pair(str(account.id), account.role.value)

    # Build response with role-specific data
    student_data = None
    faculty_data = None

    if account.role == UserRole.STUDENT:
        from app.models.account import Student
        from app.schemas.student import StudentResponse

        student_result = await session.execute(
            select(Student).where(Student.account_id == account.id)
        )
        student = student_result.scalar_one_or_none()
        if student:
            student_data = StudentResponse.model_validate(student)

    elif account.role in (UserRole.FACULTY, UserRole.SUPERADMIN):
        from app.models.account import Faculty
        from app.schemas.faculty import FacultyResponse

        faculty_result = await session.execute(
            select(Faculty).where(Faculty.account_id == account.id)
        )
        faculty = faculty_result.scalar_one_or_none()
        if faculty:
            faculty_data = FacultyResponse.model_validate(faculty)

    return LoginResponse(
        account=AccountResponse.model_validate(account),
        student=student_data,
        faculty=faculty_data,
        token=access_token,
        expires_at=(
            __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
            + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: TokenRefreshRequest,
) -> TokenResponse:
    """Refresh access token using refresh token."""
    try:
        token_payload = decode_token(payload.refresh_token)
        if token_payload.type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    access_token = create_access_token(token_payload.sub, token_payload.role)
    refresh_token = create_refresh_token(token_payload.sub, token_payload.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/logout")
async def logout(
    response: Response,
) -> dict[str, str]:
    """Logout - client should discard tokens."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=LoginResponse)
async def get_me(
    account: Account = Depends(get_current_account),
    session: AsyncSession = Depends(get_session),
) -> LoginResponse:
    """Get current authenticated user session."""
    # Create a new access token for the response
    access_token = create_access_token(str(account.id), account.role.value)

    student_data = None
    faculty_data = None

    if account.role == UserRole.STUDENT:
        from app.models.account import Student
        from app.schemas.student import StudentResponse

        student_result = await session.execute(
            select(Student).where(Student.account_id == account.id)
        )
        student = student_result.scalar_one_or_none()
        if student:
            student_data = StudentResponse.model_validate(student)

    elif account.role in (UserRole.FACULTY, UserRole.SUPERADMIN):
        from app.models.account import Faculty
        from app.schemas.faculty import FacultyResponse

        faculty_result = await session.execute(
            select(Faculty).where(Faculty.account_id == account.id)
        )
        faculty = faculty_result.scalar_one_or_none()
        if faculty:
            faculty_data = FacultyResponse.model_validate(faculty)

    return LoginResponse(
        account=AccountResponse.model_validate(account),
        student=student_data,
        faculty=faculty_data,
        token=access_token,
        expires_at=(
            __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
            + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        ),
    )