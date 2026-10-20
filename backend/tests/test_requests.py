"""Tests for clearance request workflow transitions."""

import uuid

import pytest
from httpx import AsyncClient

from app.main import app
from app.models.account import Account, ClearanceStatus, Department, Faculty, UserRole
from app.models.clearance import ClearanceEdge, ClearanceNode, ClearanceRequest
from app.routes.auth import get_current_account


@pytest.mark.asyncio
async def test_held_request_can_be_approved_after_meeting(
    client: AsyncClient, test_session
):
    faculty_account = Account(
        id=uuid.uuid4(),
        email="faculty-workflow@clearanceflow.edu",
        role=UserRole.FACULTY,
        hashed_password="unused-in-this-test",
    )
    faculty = Faculty(
        school_id="FAC-WORKFLOW-001",
        account_id=faculty_account.id,
        department=Department.CS,
        position="Faculty",
    )
    student_account = Account(
        id=uuid.uuid4(),
        email="student-workflow@clearanceflow.edu",
        role=UserRole.STUDENT,
        hashed_password="unused-in-this-test",
    )
    node = ClearanceNode(label="Library", office="University Library")
    next_node = ClearanceNode(label="Finance", office="Finance Office")
    test_session.add_all([faculty_account, faculty, student_account, node, next_node])
    await test_session.flush()
    test_session.add(ClearanceEdge(from_node_id=node.id, to_node_id=next_node.id))

    request = ClearanceRequest(
        student_account_id=student_account.id,
        node_id=node.id,
        status=ClearanceStatus.HELD,
        hold_reason="Physical document requires an in-person meeting",
    )
    next_request = ClearanceRequest(
        student_account_id=student_account.id,
        node_id=next_node.id,
        status=ClearanceStatus.PENDING,
    )
    test_session.add_all([request, next_request])
    await test_session.commit()

    app.dependency_overrides[get_current_account] = lambda: faculty_account
    blocked_response = await client.post(
        f"/api/v1/requests/{next_request.id}/approve",
        json={"faculty_account_id": str(faculty_account.id)},
    )
    assert blocked_response.status_code == 409

    response = await client.post(
        f"/api/v1/requests/{request.id}/approve",
        json={"faculty_account_id": str(faculty_account.id)},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"
    assert response.json()["hold_reason"] is None

    next_response = await client.post(
        f"/api/v1/requests/{next_request.id}/approve",
        json={"faculty_account_id": str(faculty_account.id)},
    )
    assert next_response.status_code == 200
    assert next_response.json()["status"] == "approved"