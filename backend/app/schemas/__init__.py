"""
Schemas package - exports all Pydantic schemas.
"""

from app.schemas.auth import (
    AccountCreate,
    AccountResponse,
    AccountUpdate,
    LoginRequest,
    LoginResponse,
    PasswordChangeRequest,
    TokenRefreshRequest,
    TokenResponse,
)
from app.schemas.clearance import (
    AlgorithmMetricsResponse,
    ApproveRequest,
    ClearanceEdgeCreate,
    ClearanceEdgeResponse,
    ClearanceNodeCreate,
    ClearanceNodeResponse,
    ClearanceNodeUpdate,
    ClearanceRequestCreate,
    ClearanceRequestResponse,
    ClearanceRequestUpdate,
    GraphStateResponse,
    HoldRequest,
    ScheduleSlotCreate,
    ScheduleSlotResponse,
    ScheduleSlotUpdate,
)
from app.schemas.faculty import FacultyCreate, FacultyQueueItemResponse, FacultyResponse, FacultyUpdate
from app.schemas.student import StudentClearanceViewResponse, StudentCreate, StudentResponse, StudentUpdate

__all__ = [
    # Auth
    "LoginRequest",
    "LoginResponse",
    "TokenRefreshRequest",
    "TokenResponse",
    "AccountResponse",
    "AccountCreate",
    "AccountUpdate",
    "PasswordChangeRequest",
    # Student
    "StudentResponse",
    "StudentCreate",
    "StudentUpdate",
    "StudentClearanceViewResponse",
    # Faculty
    "FacultyResponse",
    "FacultyCreate",
    "FacultyUpdate",
    "FacultyQueueItemResponse",
    # Clearance
    "ClearanceNodeResponse",
    "ClearanceNodeCreate",
    "ClearanceNodeUpdate",
    "ClearanceEdgeResponse",
    "ClearanceEdgeCreate",
    "ClearanceRequestResponse",
    "ClearanceRequestCreate",
    "ClearanceRequestUpdate",
    "ApproveRequest",
    "HoldRequest",
    "GraphStateResponse",
    "ScheduleSlotResponse",
    "ScheduleSlotCreate",
    "ScheduleSlotUpdate",
    "AlgorithmMetricsResponse",
]