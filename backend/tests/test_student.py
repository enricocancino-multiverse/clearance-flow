"""Tests for student clearance status derivation."""

import uuid

import pytest
from httpx import AsyncClient

from app.main import app
from app.models.account import Account, ClearanceStatus, Department, Student, UserRole
from app.models.clearance import ClearanceEdge, ClearanceNode, ClearanceRequest
from app.routes.auth import get_current_account


@pytest.mark.asyncio
async def test_student_view_locks_nodes_until_prerequisites_are_approved(
    client: AsyncClient, test_session
):
    student_account = Account(
        id=uuid.uuid4(),
        email="student-clearance@clearanceflow.edu",
        role=UserRole.STUDENT,
        hashed_password="unused-in-this-test",
    )
    student = Student(
        school_id="STU-CLEARANCE-001",
        account_id=student_account.id,
        department=Department.CS,
        year_level=1,
        section="A",
    )
    first = ClearanceNode(label="Library", office="University Library")
    next_node = ClearanceNode(label="Finance", office="Finance Office")
    test_session.add_all([student_account, student, first, next_node])
    await test_session.flush()
    test_session.add(ClearanceEdge(from_node_id=first.id, to_node_id=next_node.id))
    first_request = ClearanceRequest(
        student_account_id=student_account.id,
        node_id=first.id,
        status=ClearanceStatus.PENDING,
    )
    test_session.add(first_request)
    await test_session.commit()

    app.dependency_overrides[get_current_account] = lambda: student_account
    response = await client.get(f"/api/v1/students/{student.school_id}/clearance")

    assert response.status_code == 200
    statuses = {node["label"]: node["status"] for node in response.json()["nodes"]}
    assert statuses == {"Library": "pending", "Finance": "locked"}

    blocked_submission = await client.post(
        f"/api/v1/students/{student.school_id}/clearance/{next_node.id}"
    )
    assert blocked_submission.status_code == 409

    first_request.status = ClearanceStatus.APPROVED
    await test_session.commit()
    response = await client.get(f"/api/v1/students/{student.school_id}/clearance")

    assert response.status_code == 200
    statuses = {node["label"]: node["status"] for node in response.json()["nodes"]}
    assert statuses == {"Library": "approved", "Finance": "pending"}

    submission = await client.post(
        f"/api/v1/students/{student.school_id}/clearance/{next_node.id}"
    )
    assert submission.status_code == 201
    assert submission.json()["status"] == "pending"