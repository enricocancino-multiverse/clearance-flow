"""
Student routes.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.models.account import Student, UserRole
from app.models.clearance import ClearanceNode, ClearanceRequest, ScheduleSlot
from app.routes.auth import get_current_account
from app.schemas.student import StudentClearanceViewResponse, StudentResponse
from app.schemas.clearance import ScheduleSlotResponse

router = APIRouter(prefix="/students", tags=["Students"])


async def require_student_role(
    account = Depends(get_current_account),
) -> None:
    """Ensure the current user is a student."""
    if account.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )


@router.get("/{student_id}/clearance", response_model=StudentClearanceViewResponse)
async def get_student_clearance(
    student_id: str,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_student_role),
) -> StudentClearanceViewResponse:
    """
    Get student's clearance view: DAG nodes with statuses, overall progress, and schedule.
    The student_id can be either account_id (UUID) or school_id.
    """
    # Try to find student by account_id (UUID) first, then by school_id
    student_result = await session.execute(
        select(Student)
        .options(selectinload(Student.account))
        .where((Student.account_id == student_id) | (Student.school_id == student_id.upper()))
    )
    student = student_result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Get all clearance nodes in topological order (for display)
    nodes_result = await session.execute(
        select(ClearanceNode).order_by(ClearanceNode.position_y, ClearanceNode.position_x)
    )
    nodes = nodes_result.scalars().all()

    # Get student's clearance requests
    requests_result = await session.execute(
        select(ClearanceRequest)
        .where(ClearanceRequest.student_account_id == student.account_id)
    )
    requests = {str(req.node_id): req for req in requests_result.scalars().all()}

    # Build node statuses
    from app.models.account import ClearanceStatus

    node_statuses = []
    for node in nodes:
        request = requests.get(str(node.id))
        status = request.status if request else ClearanceStatus.PENDING
        node_statuses.append({
            "id": str(node.id),
            "label": node.label,
            "office": node.office,
            "position_x": node.position_x,
            "position_y": node.position_y,
            "status": status.value,
            "created_at": node.created_at,
        })

    # Calculate overall progress
    total_nodes = len(nodes)
    approved_count = sum(1 for n in node_statuses if n["status"] == "approved")
    overall_progress = int((approved_count / total_nodes * 100)) if total_nodes > 0 else 0

    # Get student's schedule
    schedule_result = await session.execute(
        select(ScheduleSlot)
        .where(ScheduleSlot.faculty_account_id.is_not(None))
        .order_by(ScheduleSlot.date, ScheduleSlot.time_start)
        .limit(10)
    )
    schedule = schedule_result.scalars().all()

    return StudentClearanceViewResponse(
        student=StudentResponse.model_validate(student),
        nodes=node_statuses,
        overall_progress=overall_progress,
        schedule=[ScheduleSlotResponse.model_validate(s) for s in schedule],
    )


@router.get("/{student_id}/schedule", response_model=list[ScheduleSlotResponse])
async def get_student_schedule(
    student_id: str,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_student_role),
) -> list[ScheduleSlotResponse]:
    """Get student's upcoming sign-off schedule slots."""
    # Find student
    student_result = await session.execute(
        select(Student).where((Student.account_id == student_id) | (Student.school_id == student_id.upper()))
    )
    student = student_result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Get schedule slots for the student's pending requests
    # This is a simplified version - in reality, you'd match based on node/office
    schedule_result = await session.execute(
        select(ScheduleSlot)
        .order_by(ScheduleSlot.date, ScheduleSlot.time_start)
        .limit(20)
    )
    schedule = schedule_result.scalars().all()

    return [ScheduleSlotResponse.model_validate(s) for s in schedule]