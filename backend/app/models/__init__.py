"""
Models package - exports all SQLAlchemy models.
"""

from app.models.account import (
    Account,
    AvailabilityStatus,
    ClearanceStatus,
    Department,
    Faculty,
    Student,
    ThemePreference,
    UserRole,
)
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.clearance import (
    AlgorithmMetrics,
    ClearanceEdge,
    ClearanceNode,
    ClearanceRequest,
    ScheduleSlot,
)

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    # Account models
    "Account",
    "Student",
    "Faculty",
    "UserRole",
    "Department",
    "ThemePreference",
    "AvailabilityStatus",
    "ClearanceStatus",
    # Clearance models
    "ClearanceNode",
    "ClearanceEdge",
    "ClearanceRequest",
    "ScheduleSlot",
    "AlgorithmMetrics",
]