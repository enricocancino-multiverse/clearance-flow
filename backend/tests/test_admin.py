"""Tests for admin clearance graph management."""

import uuid

import pytest
from httpx import AsyncClient

from app.main import app
from app.models.account import Account, UserRole
from app.models.clearance import ClearanceEdge, ClearanceNode
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