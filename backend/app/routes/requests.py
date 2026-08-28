"""
Clearance request routes: approve, hold.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.account import Faculty, UserRole
from app.models.clearance import ClearanceRequest
from app.routes.auth import get_current_account
from app.schemas.clearance import ApproveRequest, ClearanceRequestResponse, HoldRequest

router = APIRouter(prefix="/requests", tags=["Requests"])


async def require_faculty_or_admin(
    account = Depends(get_current_account),
) -> None:
    """Ensure the current user is faculty or superadmin."""
    if account.role not in (UserRole.FACULTY, UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty or admin access required",
        )


@router.post("/{request_id}/approve", response_model=ClearanceRequestResponse)
async def approve_request(
    request_id: str,
    payload: ApproveRequest,
    session: AsyncSession = Depends(get_session),
    current_account = Depends(get_current_account),
    _: None = Depends(require_faculty_or_admin),
) -> ClearanceRequestResponse:
    """
    Approve a clearance request.
    Only the assigned faculty or superadmin can approve.
    """
    # Get the request
    request_result = await session.execute(
        select(ClearanceRequest).where(ClearanceRequest.id == request_id)
    )
    request = request_result.scalar_one_or_none()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve request with status: {request.status}",
        )

    # Verify faculty authorization
    if current_account.role != UserRole.SUPERADMIN:
        faculty_result = await session.execute(
            select(Faculty).where(Faculty.account_id == current_account.id)
        )
        faculty = faculty_result.scalar_one_or_none()

        if not faculty or str(faculty.account_id) != payload.faculty_account_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to approve this request",
            )

    # Approve the request
    request.status = "approved"
    request.faculty_account_id = payload.faculty_account_id
    request.approved_at = datetime.now()
    await session.commit()
    await session.refresh(request)

    return ClearanceRequestResponse.model_validate(request)


@router.post("/{request_id}/hold", response_model=ClearanceRequestResponse)
async def hold_request(
    request_id: str,
    payload: HoldRequest,
    session: AsyncSession = Depends(get_session),
    current_account = Depends(get_current_account),
    _: None = Depends(require_faculty_or_admin),
) -> ClearanceRequestResponse:
    """
    Hold a clearance request with a reason.
    Only the assigned faculty or superadmin can hold.
    """
    # Get the request
    request_result = await session.execute(
        select(ClearanceRequest).where(ClearanceRequest.id == request_id)
    )
    request = request_result.scalar_one_or_none()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    if request.status not in ("pending", "held"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot hold request with status: {request.status}",
        )

    # Verify faculty authorization
    if current_account.role != UserRole.SUPERADMIN:
        faculty_result = await session.execute(
            select(Faculty).where(Faculty.account_id == current_account.id)
        )
        faculty = faculty_result.scalar_one_or_none()

        if not faculty or str(faculty.account_id) != payload.faculty_account_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to hold this request",
            )

    # Hold the request
    request.status = "held"
    request.faculty_account_id = payload.faculty_account_id
    request.hold_reason = payload.reason
    await session.commit()
    await session.refresh(request)

    return ClearanceRequestResponse.model_validate(request)