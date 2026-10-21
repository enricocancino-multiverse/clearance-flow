"""
Faculty routes.
"""

import heapq
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.models.account import Faculty, Student, UserRole, AvailabilityStatus
from app.models.clearance import ClearanceRequest, ClearanceEdge, ScheduleSlot
from app.routes.auth import get_current_account
from app.schemas.faculty import FacultyQueueItemResponse, FacultyResponse
from app.schemas.clearance import (
    ClearanceRequestResponse,
    ScheduleSlotCreate,
    ScheduleSlotResponse,
)
from app.schemas.student import StudentResponse

router = APIRouter(prefix="/faculty", tags=["Faculty"])


async def require_faculty_role(
    account = Depends(get_current_account),
) -> None:
    """Ensure the current user is faculty or superadmin."""
    if account.role not in (UserRole.FACULTY, UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty access required",
        )


@router.get("/{faculty_id}/queue", response_model=list[FacultyQueueItemResponse])
async def get_faculty_queue(
    faculty_id: str,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_faculty_role),
) -> list[FacultyQueueItemResponse]:
    """
    Get faculty's priority-sorted request queue.
    Uses priority scoring (exam date, prerequisites completed, etc.)
    """
    # Find faculty
    faculty_result = await session.execute(
        select(Faculty).where((Faculty.account_id == faculty_id) | (Faculty.school_id == faculty_id.upper()))
    )
    faculty = faculty_result.scalar_one_or_none()

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty not found",
        )

    # Get all clearance nodes and edges for prerequisite calculation
    edges_result = await session.execute(select(ClearanceEdge))
    edges = edges_result.scalars().all()

    # Build adjacency list for prerequisite checking
    prereq_map = {}
    for edge in edges:
        to_id = str(edge.to_node_id)
        from_id = str(edge.from_node_id)
        if to_id not in prereq_map:
            prereq_map[to_id] = []
        prereq_map[to_id].append(from_id)

    # Get pending requests for this faculty's department
    # (In a real system, you'd filter by the offices this faculty handles)
    requests_result = await session.execute(
        select(ClearanceRequest)
        .options(selectinload(ClearanceRequest.student).selectinload(Student.account))
        .where(ClearanceRequest.status == "pending")
        .order_by(ClearanceRequest.submitted_at)
    )
    requests = requests_result.scalars().all()

    approved_by_student: dict[str, set[str]] = {}
    student_ids = {request.student_account_id for request in requests}
    if student_ids:
        approved_result = await session.execute(
            select(ClearanceRequest.student_account_id, ClearanceRequest.node_id).where(
                ClearanceRequest.student_account_id.in_(student_ids),
                ClearanceRequest.status == "approved",
            )
        )
        for student_id, node_id in approved_result.all():
            approved_by_student.setdefault(str(student_id), set()).add(str(node_id))

    # Use a max-priority greedy queue, with submission time and request ID as stable tie-breakers.
    priority_queue: list[tuple[float, float, str, FacultyQueueItemResponse]] = []
    for request in requests:
        student = request.student
        if not student:
            continue

        # Calculate prerequisites done/total for this node
        node_id = str(request.node_id)
        prereq_ids = prereq_map.get(node_id, [])
        prereqs_total = len(prereq_ids)

        # Count completed prerequisites
        approved_node_ids = approved_by_student.get(str(student.account_id), set())
        prereqs_done = sum(1 for pid in prereq_ids if pid in approved_node_ids)

        priority_score = 0.0
        if student.exam_date:
            exam_now = datetime.now(student.exam_date.tzinfo) if student.exam_date.tzinfo else datetime.now()
            days_until_exam = (student.exam_date.date() - exam_now.date()).days
            if days_until_exam <= 0:
                priority_score += 100
            elif days_until_exam <= 7:
                priority_score += 90
            elif days_until_exam <= 14:
                priority_score += 70
            elif days_until_exam <= 30:
                priority_score += 50
            else:
                priority_score += 20

        priority_score += (prereqs_done / prereqs_total) * 50 if prereqs_total else 50
        submitted_now = datetime.now(request.submitted_at.tzinfo) if request.submitted_at.tzinfo else datetime.now()
        hours_waiting = max(0.0, (submitted_now - request.submitted_at).total_seconds() / 3600)
        priority_score += min(10.0, hours_waiting)
        if student.department == faculty.department:
            priority_score += 5

        item = FacultyQueueItemResponse(
            request=ClearanceRequestResponse.model_validate(request),
            student=StudentResponse.model_validate(student),
            priority_score=round(priority_score, 2),
            prereqs_done=prereqs_done,
            prereqs_total=prereqs_total,
        )
        submitted_at = request.submitted_at.timestamp()
        heapq.heappush(priority_queue, (-item.priority_score, submitted_at, str(request.id), item))

    return [heapq.heappop(priority_queue)[3] for _ in range(len(priority_queue))]


@router.patch("/{faculty_id}/availability", response_model=FacultyResponse)
async def set_availability(
    faculty_id: str,
    availability: AvailabilityStatus,
    session: AsyncSession = Depends(get_session),
    current_account = Depends(get_current_account),
) -> FacultyResponse:
    """Update faculty availability status."""
    # Verify authorization - faculty can only update their own availability
    faculty_result = await session.execute(
        select(Faculty).where(Faculty.account_id == current_account.id)
    )
    faculty = faculty_result.scalar_one_or_none()

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty profile not found",
        )

    faculty.availability = availability
    await session.commit()
    await session.refresh(faculty)

    return FacultyResponse.model_validate(faculty)


@router.post(
    "/{faculty_id}/office-hours",
    response_model=ScheduleSlotResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_office_hours(
    faculty_id: str,
    payload: ScheduleSlotCreate,
    session: AsyncSession = Depends(get_session),
    current_account=Depends(get_current_account),
    _: None = Depends(require_faculty_role),
) -> ScheduleSlotResponse:
    """Add an office-hour slot for the signed-in faculty member."""
    faculty_result = await session.execute(
        select(Faculty).where(Faculty.account_id == current_account.id)
    )
    faculty = faculty_result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty profile not found",
        )

    if faculty_id.lower() not in (str(faculty.account_id).lower(), faculty.school_id.lower()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty can only manage their own office hours",
        )

    slot = ScheduleSlot(
        **payload.model_dump(exclude={"faculty_account_id"}),
        faculty_account_id=faculty.account_id,
    )
    session.add(slot)
    await session.commit()
    await session.refresh(slot)
    return ScheduleSlotResponse.model_validate(slot)