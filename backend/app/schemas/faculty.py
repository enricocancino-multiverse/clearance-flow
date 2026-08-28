"""
Faculty schemas.
"""

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field

from app.models.account import AvailabilityStatus, Department


class FacultyBase(BaseModel):
    """Base faculty schema."""
    school_id: str
    department: Department
    is_superadmin: bool = False
    position: str
    availability: AvailabilityStatus = AvailabilityStatus.ACCEPTING


class FacultyCreate(FacultyBase):
    """Faculty creation schema."""
    account_id: UUID


class FacultyUpdate(BaseModel):
    """Faculty update schema."""
    department: Optional[Department] = None
    is_superadmin: Optional[bool] = None
    position: Optional[str] = None
    availability: Optional[AvailabilityStatus] = None


class FacultyResponse(FacultyBase):
    """Faculty response schema."""
    account_id: UUID
    created_at: datetime
    updated_at: datetime
    account: Optional["AccountResponse"] = None

    class Config:
        from_attributes = True


class FacultyQueueItemResponse(BaseModel):
    """Faculty queue item with student info and priority."""
    request: "ClearanceRequestResponse"
    student: StudentResponse
    priority_score: float
    prereqs_done: int
    prereqs_total: int

    class Config:
        from_attributes = True


# Forward references
from app.schemas.auth import AccountResponse
from app.schemas.student import StudentResponse
from app.schemas.clearance import ClearanceRequestResponse

FacultyResponse.model_rebuild()
FacultyQueueItemResponse.model_rebuild()