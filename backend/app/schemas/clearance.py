"""
Clearance DAG schemas: nodes, edges, requests, schedule, graph state, metrics.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ClearanceNodeBase(BaseModel):
    """Base clearance node schema."""
    label: str = Field(..., min_length=1, max_length=100)
    office: str = Field(..., min_length=1, max_length=200)
    position_x: float = 0.0
    position_y: float = 0.0


class ClearanceNodeCreate(ClearanceNodeBase):
    """Clearance node creation schema."""
    pass


class ClearanceNodeUpdate(BaseModel):
    """Clearance node update schema."""
    label: Optional[str] = Field(None, min_length=1, max_length=100)
    office: Optional[str] = Field(None, min_length=1, max_length=200)
    position_x: Optional[float] = None
    position_y: Optional[float] = None


class ClearanceNodeResponse(ClearanceNodeBase):
    """Clearance node response schema."""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ClearanceEdgeBase(BaseModel):
    """Base clearance edge schema."""
    from_node_id: UUID
    to_node_id: UUID


class ClearanceEdgeCreate(ClearanceEdgeBase):
    """Clearance edge creation schema."""
    pass


class ClearanceEdgeResponse(ClearanceEdgeBase):
    """Clearance edge response schema."""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class GraphStateResponse(BaseModel):
    """Complete graph state for admin."""
    nodes: list[ClearanceNodeResponse]
    edges: list[ClearanceEdgeResponse]

    class Config:
        from_attributes = True


class ClearanceRequestBase(BaseModel):
    """Base clearance request schema."""
    student_account_id: UUID
    node_id: UUID


class ClearanceRequestCreate(ClearanceRequestBase):
    """Clearance request creation schema."""
    pass


class ClearanceRequestUpdate(BaseModel):
    """Clearance request update schema."""
    faculty_account_id: Optional[str] = None
    status: Optional[str] = None
    hold_reason: Optional[str] = None


class ClearanceRequestResponse(ClearanceRequestBase):
    """Clearance request response schema."""
    id: UUID
    faculty_account_id: Optional[UUID] = None
    status: str
    hold_reason: Optional[str] = None
    submitted_at: datetime
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApproveRequest(BaseModel):
    """Approve request schema."""
    faculty_account_id: str


class HoldRequest(BaseModel):
    """Hold request schema."""
    faculty_account_id: str
    reason: str = Field(..., min_length=1)


class ScheduleSlotBase(BaseModel):
    """Base schedule slot schema."""
    office: str = Field(..., min_length=1, max_length=200)
    date: datetime
    time_start: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    time_end: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    queue_position: int = 0
    queue_total: int = 0


class ScheduleSlotCreate(ScheduleSlotBase):
    """Schedule slot creation schema."""
    faculty_account_id: Optional[str] = None


class ScheduleSlotUpdate(BaseModel):
    """Schedule slot update schema."""
    office: Optional[str] = None
    date: Optional[datetime] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    queue_position: Optional[int] = None
    queue_total: Optional[int] = None
    faculty_account_id: Optional[str] = None


class ScheduleSlotResponse(ScheduleSlotBase):
    """Schedule slot response schema."""
    id: UUID
    faculty_account_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlgorithmMetricsResponse(BaseModel):
    """Algorithm metrics response schema."""
    id: str
    execution_time_ms: int
    vertex_count: int
    edge_count: int
    heap_usage_mb: float
    simulated_user_count: int
    complexity: str
    recorded_at: datetime

    class Config:
        from_attributes = True


class AlgorithmRunRequest(BaseModel):
    """Options for running the clearance graph algorithm."""

    simulated_user_count: int = Field(default=100, ge=0, le=1_000_000)


class AlgorithmRunResponse(BaseModel):
    """Topological order and execution metrics for one graph run."""

    sorted_node_ids: list[str]
    has_cycle: bool
    metrics: AlgorithmMetricsResponse