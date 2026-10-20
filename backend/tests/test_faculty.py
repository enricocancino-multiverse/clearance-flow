"""Tests for faculty office-hour management."""

import uuid

import pytest
from httpx import AsyncClient

from app.main import app
from app.models.account import Account, Department, Faculty, UserRole
from app.routes.auth import get_current_account


@pytest.mark.asyncio
async def test_faculty_can_create_own_office_hours(client: AsyncClient, test_session):
    faculty_account = Account(
        id=uuid.uuid4(),
        email="faculty-hours@clearanceflow.edu",
        role=UserRole.FACULTY,
        hashed_password="unused-in-this-test",
    )
    faculty = Faculty(
        school_id="FAC-HOURS-001",
        account_id=faculty_account.id,
        department=Department.CS,
        position="Faculty",
    )
    test_session.add_all([faculty_account, faculty])
    await test_session.commit()

    app.dependency_overrides[get_current_account] = lambda: faculty_account
    response = await client.post(
        f"/api/v1/faculty/{faculty.school_id}/office-hours",
        json={
            "office": "Computer Science Office",
            "date": "2026-10-02T00:00:00",
            "time_start": "09:00",
            "time_end": "11:00",
        },
    )

    assert response.status_code == 201
    assert response.json()["office"] == "Computer Science Office"
    assert response.json()["faculty_account_id"] == str(faculty_account.id)