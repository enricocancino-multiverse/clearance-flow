"""
Account and user models.
"""

from datetime import datetime
import enum
from typing import Any, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, GUID, TimestampMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    """User roles in the system."""
    STUDENT = "student"
    FACULTY = "faculty"
    SUPERADMIN = "superadmin"


class ThemePreference(str, enum.Enum):
    """Theme preference."""
    LIGHT = "light"
    DARK = "dark"


class Department(str, enum.Enum):
    """Academic departments."""
    CS = "cs"
    HM = "hm"
    CRIM = "crim"
    BASICED = "basiced"
    TESDA = "tesda"


class AvailabilityStatus(str, enum.Enum):
    """Faculty availability status."""
    ACCEPTING = "accepting"
    IN_CLASS = "in-class"
    AWAY = "away"


class ClearanceStatus(str, enum.Enum):
    """Clearance request status."""
    PENDING = "pending"
    APPROVED = "approved"
    HELD = "held"
    LOCKED = "locked"


class Account(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Account - primary authentication identity."""

    __tablename__ = "accounts"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    theme_preference: Mapped[ThemePreference] = mapped_column(
        Enum(ThemePreference), nullable=False, default=ThemePreference.DARK
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    student: Mapped[Optional["Student"]] = relationship(
        "Student", back_populates="account", uselist=False, cascade="all, delete-orphan"
    )
    faculty: Mapped[Optional["Faculty"]] = relationship(
        "Faculty", back_populates="account", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, email={self.email}, role={self.role})>"


class Student(Base, TimestampMixin):
    """Student profile linked to account."""

    __tablename__ = "students"

    school_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    account_id: Mapped[Any] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    department: Mapped[Department] = mapped_column(Enum(Department), nullable=False)
    year_level: Mapped[int] = mapped_column(nullable=False)
    section: Mapped[str] = mapped_column(String(20), nullable=False)
    exam_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="student")
    clearance_requests: Mapped[list["ClearanceRequest"]] = relationship(
        "ClearanceRequest",
        back_populates="student",
        primaryjoin="Student.account_id == foreign(ClearanceRequest.student_account_id)",
        foreign_keys="ClearanceRequest.student_account_id",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("account_id", name="uq_student_account"),
    )

    def __repr__(self) -> str:
        return f"<Student(school_id={self.school_id}, account_id={self.account_id})>"


class Faculty(Base, TimestampMixin):
    """Faculty profile linked to account."""

    __tablename__ = "faculty"

    school_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    account_id: Mapped[Any] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    department: Mapped[Department] = mapped_column(Enum(Department), nullable=False)
    is_superadmin: Mapped[bool] = mapped_column(nullable=False, default=False)
    position: Mapped[str] = mapped_column(String(100), nullable=False)
    availability: Mapped[AvailabilityStatus] = mapped_column(
        Enum(AvailabilityStatus), nullable=False, default=AvailabilityStatus.ACCEPTING
    )

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="faculty")
    processed_requests: Mapped[list["ClearanceRequest"]] = relationship(
        "ClearanceRequest",
        back_populates="faculty",
        primaryjoin="Faculty.account_id == foreign(ClearanceRequest.faculty_account_id)",
        foreign_keys="ClearanceRequest.faculty_account_id",
    )

    __table_args__ = (
        UniqueConstraint("account_id", name="uq_faculty_account"),
    )

    def __repr__(self) -> str:
        return f"<Faculty(school_id={self.school_id}, is_superadmin={self.is_superadmin})>"

# Import datetime at the top
from datetime import datetime