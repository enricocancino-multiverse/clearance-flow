"""
Student schemas.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.account import Department


class StudentBase(BaseModel):
    """Base student schema."""
    school_id: str
    department: Department
    year_level: int = Field(..., ge=1, le=4)
    section: str
    exam_date: Optional[datetime] = None


class StudentCreate(StudentBase):
    """Student creation schema."""
    account_id: UUID


class StudentUpdate(BaseModel):
    """Student update schema."""
    department: Optional[Department] = None
    year_level: Optional[int] = Field(None, ge=1, le=4)
    section: Optional[str] = None
    exam_date: Optional[datetime] = None


class StudentResponse(StudentBase):
    """Student response schema."""
    account_id: UUID
    created_at: datetime
    updated_at: datetime
    account: Optional["AccountResponse"] = None

    class Config:
        from_attributes = True


class StudentClearanceNodeResponse(BaseModel):
    """Clearance node with status for student view."""
    id: str
    label: str
    office: str
    position_x: float
    position_y: float
    status: str  # ClearanceStatus
    created_at: datetime

    class Config:
        from_attributes = True


class StudentClearanceViewResponse(BaseModel):
    """Complete student clearance view."""
    student: StudentResponse
    nodes: list[StudentClearanceNodeResponse]
    overall_progress: int = Field(..., ge=0, le=100)
    schedule: list["ScheduleSlotResponse"] = []

    class Config:
        from_attributes = True


# Forward reference
from app.schemas.auth import AccountResponse
from app.schemas.clearance import ScheduleSlotResponse

StudentResponse.model_rebuild()
StudentClearanceViewResponse.model_rebuild()