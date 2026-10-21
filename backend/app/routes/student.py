"""
Student routes.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.models.account import ClearanceStatus, Student, UserRole
from app.models.clearance import ClearanceEdge, ClearanceNode, ClearanceRequest, ScheduleSlot
from app.routes.auth import get_current_account
from app.services.kahn_service import KahnAlgorithmError, KahnService
from app.schemas.student import StudentClearanceViewResponse, StudentResponse
from app.schemas.clearance import ClearanceRequestResponse, ScheduleSlotResponse

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

    # Sort requirements by their prerequisite graph before building the student view.
    nodes_result = await session.execute(select(ClearanceNode))
    nodes = list(nodes_result.scalars().all())
    edges_result = await session.execute(select(ClearanceEdge))
    edges = list(edges_result.scalars().all())
    try:
        with KahnService() as algorithm:
            algorithm.create_handle(nodes, edges)
            ordered_ids, has_cycle, _ = algorithm.execute()
    except KahnAlgorithmError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Clearance requirements are invalid: {exc}",
        ) from exc
    if has_cycle:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Clearance requirements contain a cycle and cannot be ordered",
        )
    nodes_by_id = {str(node.id): node for node in nodes}
    nodes = [nodes_by_id[node_id] for node_id in ordered_ids]

    # Get student's clearance requests
    requests_result = await session.execute(
        select(ClearanceRequest)
        .where(ClearanceRequest.student_account_id == student.account_id)
    )
    requests = {str(req.node_id): req for req in requests_result.scalars().all()}

    prerequisites_by_node: dict[str, list[str]] = {}
    for edge in edges:
        prerequisites_by_node.setdefault(str(edge.to_node_id), []).append(
            str(edge.from_node_id)
        )
    approved_node_ids = {
        node_id
        for node_id, request in requests.items()
        if request.status == ClearanceStatus.APPROVED
    }

    # Build node statuses
    node_statuses = []
    for node in nodes:
        request = requests.get(str(node.id))
        prerequisite_ids = prerequisites_by_node.get(str(node.id), [])
        prerequisites_met = all(
            prerequisite_id in approved_node_ids for prerequisite_id in prerequisite_ids
        )
        if not prerequisites_met and (not request or request.status != ClearanceStatus.APPROVED):
            node_status = ClearanceStatus.LOCKED
        else:
            node_status = request.status if request else ClearanceStatus.PENDING
        node_statuses.append({
            "id": str(node.id),
            "label": node.label,
            "office": node.office,
            "position_x": node.position_x,
            "position_y": node.position_y,
            "status": node_status.value,
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


@router.post(
    "/{student_id}/clearance/{node_id}",
    response_model=ClearanceRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_clearance_request(
    student_id: str,
    node_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_account=Depends(get_current_account),
    _: None = Depends(require_student_role),
) -> ClearanceRequestResponse:
    """Submit a request for an available clearance node."""
    student_result = await session.execute(
        select(Student).where(
            (Student.account_id == student_id)
            | (Student.school_id == student_id.upper())
        )
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    if student.account_id != current_account.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students can only submit their own clearance requests",
        )

    node_result = await session.execute(
        select(ClearanceNode).where(ClearanceNode.id == node_id)
    )
    node = node_result.scalar_one_or_none()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clearance node not found",
        )

    existing_result = await session.execute(
        select(ClearanceRequest).where(
            ClearanceRequest.student_account_id == student.account_id,
            ClearanceRequest.node_id == node.id,
        )
    )
    existing_request = existing_result.scalar_one_or_none()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Clearance request already exists with status: {existing_request.status}",
        )

    prerequisite_result = await session.execute(
        select(ClearanceEdge.from_node_id).where(ClearanceEdge.to_node_id == node.id)
    )
    prerequisite_ids = [row[0] for row in prerequisite_result.all()]
    if prerequisite_ids:
        approved_result = await session.execute(
            select(ClearanceRequest.node_id).where(
                ClearanceRequest.student_account_id == student.account_id,
                ClearanceRequest.node_id.in_(prerequisite_ids),
                ClearanceRequest.status == ClearanceStatus.APPROVED,
            )
        )
        approved_ids = {row[0] for row in approved_result.all()}
        if len(approved_ids) != len(set(prerequisite_ids)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Prerequisite clearances are not approved",
            )

    request = ClearanceRequest(
        student_account_id=student.account_id,
        node_id=node.id,
        status=ClearanceStatus.PENDING,
    )
    session.add(request)
    await session.commit()
    await session.refresh(request)
    return ClearanceRequestResponse.model_validate(request)


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