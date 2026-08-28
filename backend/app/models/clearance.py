"""
Clearance DAG models: nodes, edges, requests, schedule.
"""

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, foreign, mapped_column, relationship

from app.models.account import (
    Account,
    AvailabilityStatus,
    ClearanceStatus,
    Department,
    Faculty,
    Student,
    UserRole,
)
from app.models.base import Base, GUID, TimestampMixin, UUIDPrimaryKeyMixin


class ClearanceNode(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Clearance node/office in the DAG."""

    __tablename__ = "clearance_nodes"

    label: Mapped[str] = mapped_column(String(100), nullable=False)
    office: Mapped[str] = mapped_column(String(200), nullable=False)
    position_x: Mapped[float] = mapped_column(nullable=False, default=0.0)
    position_y: Mapped[float] = mapped_column(nullable=False, default=0.0)

    # Relationships
    outgoing_edges: Mapped[list["ClearanceEdge"]] = relationship(
        "ClearanceEdge", back_populates="from_node", foreign_keys="ClearanceEdge.from_node_id"
    )
    incoming_edges: Mapped[list["ClearanceEdge"]] = relationship(
        "ClearanceEdge", back_populates="to_node", foreign_keys="ClearanceEdge.to_node_id"
    )
    clearance_requests: Mapped[list["ClearanceRequest"]] = relationship(
        "ClearanceRequest", back_populates="node"
    )

    def __repr__(self) -> str:
        return f"<ClearanceNode(id={self.id}, label={self.label})>"


class ClearanceEdge(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Prerequisite edge between clearance nodes (DAG edge)."""

    __tablename__ = "clearance_edges"

    from_node_id: Mapped[Any] = mapped_column(
        GUID(),
        ForeignKey("clearance_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    to_node_id: Mapped[Any] = mapped_column(
        GUID(),
        ForeignKey("clearance_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    from_node: Mapped["ClearanceNode"] = relationship(
        "ClearanceNode", back_populates="outgoing_edges", foreign_keys=[from_node_id]
    )
    to_node: Mapped["ClearanceNode"] = relationship(
        "ClearanceNode", back_populates="incoming_edges", foreign_keys=[to_node_id]
    )

    __table_args__ = (
        UniqueConstraint("from_node_id", "to_node_id", name="uq_clearance_edge"),
    )

    def __repr__(self) -> str:
        return f"<ClearanceEdge(from={self.from_node_id}, to={self.to_node_id})>"


class ClearanceRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Student clearance request for a specific node."""

    __tablename__ = "clearance_requests"

    student_account_id: Mapped[Any] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id: Mapped[Any] = mapped_column(
        GUID(),
        ForeignKey("clearance_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    faculty_account_id: Mapped[Optional[Any]] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[ClearanceStatus] = mapped_column(
        Enum(ClearanceStatus), nullable=False, default=ClearanceStatus.PENDING
    )
    hold_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now())
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    student: Mapped["Student"] = relationship(
        "Student",
        back_populates="clearance_requests",
        primaryjoin="foreign(ClearanceRequest.student_account_id) == Student.account_id",
        foreign_keys=[student_account_id],
    )
    faculty: Mapped[Optional["Faculty"]] = relationship(
        "Faculty",
        back_populates="processed_requests",
        primaryjoin="foreign(ClearanceRequest.faculty_account_id) == Faculty.account_id",
        foreign_keys=[faculty_account_id],
    )
    node: Mapped["ClearanceNode"] = relationship("ClearanceNode", back_populates="clearance_requests")

    def __repr__(self) -> str:
        return f"<ClearanceRequest(student={self.student_account_id}, node={self.node_id}, status={self.status})>"


class ScheduleSlot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Faculty sign-off schedule slot."""

    __tablename__ = "schedule_slots"

    office: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[datetime] = mapped_column(nullable=False, index=True)
    time_start: Mapped[str] = mapped_column(String(5), nullable=False)  # HH:MM
    time_end: Mapped[str] = mapped_column(String(5), nullable=False)    # HH:MM
    queue_position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    queue_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    faculty_account_id: Mapped[Optional[Any]] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True,
    )

    def __repr__(self) -> str:
        return f"<ScheduleSlot(office={self.office}, date={self.date}, time={self.time_start}-{self.time_end})>"


class AlgorithmMetrics(Base, UUIDPrimaryKeyMixin):
    """Kahn's algorithm execution metrics from C++ module."""

    __tablename__ = "algorithm_metrics"

    execution_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    vertex_count: Mapped[int] = mapped_column(Integer, nullable=False)
    edge_count: Mapped[int] = mapped_column(Integer, nullable=False)
    heap_usage_mb: Mapped[float] = mapped_column(nullable=False)
    simulated_user_count: Mapped[int] = mapped_column(Integer, nullable=False)
    complexity: Mapped[str] = mapped_column(String(50), nullable=False, default="O(V+E)")
    recorded_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(), index=True)

    def __repr__(self) -> str:
        return f"<AlgorithmMetrics(v={self.vertex_count}, e={self.edge_count}, time={self.execution_time_ms}ms)>"