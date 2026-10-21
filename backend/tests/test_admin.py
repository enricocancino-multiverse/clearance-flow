"""Tests for admin clearance graph management."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.main import app
from app.models.account import Account, Department, Faculty, UserRole
from app.models.clearance import AlgorithmMetrics, ClearanceEdge, ClearanceNode
from app.routes.auth import get_current_account


@pytest.mark.asyncio
async def test_create_rule_rejects_multi_node_cycle(client: AsyncClient, test_session):
    admin = Account(
        id=uuid.uuid4(),
        email="admin-graph@clearanceflow.edu",
        role=UserRole.SUPERADMIN,
        hashed_password="unused-in-this-test",
    )
    first = ClearanceNode(label="First", office="First Office")
    second = ClearanceNode(label="Second", office="Second Office")
    third = ClearanceNode(label="Third", office="Third Office")
    test_session.add_all([admin, first, second, third])
    await test_session.flush()
    test_session.add_all(
        [
            ClearanceEdge(from_node_id=second.id, to_node_id=third.id),
            ClearanceEdge(from_node_id=third.id, to_node_id=first.id),
        ]
    )
    await test_session.commit()

    app.dependency_overrides[get_current_account] = lambda: admin
    response = await client.post(
        "/api/v1/admin/rules",
        json={"from_node_id": str(first.id), "to_node_id": str(second.id)},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Rule would create a cycle"


@pytest.mark.asyncio
async def test_run_algorithm_returns_order_and_records_metrics(client: AsyncClient, test_session):
    admin = Account(
        id=uuid.uuid4(),
        email="algorithm-admin@clearanceflow.edu",
        role=UserRole.SUPERADMIN,
        hashed_password="unused-in-this-test",
    )
    first = ClearanceNode(label="First", office="First Office")
    second = ClearanceNode(label="Second", office="Second Office")
    test_session.add_all([admin, first, second])
    await test_session.flush()
    test_session.add(ClearanceEdge(from_node_id=first.id, to_node_id=second.id))
    await test_session.commit()

    app.dependency_overrides[get_current_account] = lambda: admin
    response = await client.post(
        "/api/v1/admin/algorithm/run",
        json={"simulated_user_count": 12},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["has_cycle"] is False
    assert payload["sorted_node_ids"] == [str(first.id), str(second.id)]
    assert payload["metrics"]["vertex_count"] == 2
    assert payload["metrics"]["edge_count"] == 1
    assert payload["metrics"]["simulated_user_count"] == 12

    metrics = await test_session.execute(select(AlgorithmMetrics))
    assert len(metrics.scalars().all()) == 1


@pytest.mark.asyncio
async def test_list_users_includes_faculty_department(client: AsyncClient, test_session):
    admin = Account(
        id=uuid.uuid4(),
        email="admin-users@clearanceflow.edu",
        role=UserRole.SUPERADMIN,
        hashed_password="unused-in-this-test",
    )
    faculty_account = Account(
        id=uuid.uuid4(),
        email="faculty-hmt@clearanceflow.edu",
        role=UserRole.FACULTY,
        hashed_password="unused-in-this-test",
    )
    faculty = Faculty(
        school_id="FAC-HMT-001",
        account_id=faculty_account.id,
        department=Department.TESDA,
        position="Faculty Member",
    )
    test_session.add_all([admin, faculty_account, faculty])
    await test_session.commit()

    app.dependency_overrides[get_current_account] = lambda: admin
    response = await client.get("/api/v1/admin/users")

    assert response.status_code == 200
    accounts = {account["email"]: account for account in response.json()}
    assert accounts["faculty-hmt@clearanceflow.edu"]["department"] == "tesda"