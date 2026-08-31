"""
Tests for authentication routes.
"""

import pytest
from httpx import AsyncClient


class TestAuthRoutes:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_login_student_success(self, client: AsyncClient, demo_accounts):
        """Test successful student login with email."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "student@clearanceflow.edu",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["account"]["email"] == "student@clearanceflow.edu"
        assert data["account"]["role"] == "student"
        assert data["student"] is not None
        assert data["student"]["school_id"] == "2026-STU-001"

    @pytest.mark.asyncio
    async def test_login_student_with_school_id(self, client: AsyncClient, demo_accounts):
        """Test successful student login with school ID."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "2026-STU-001",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["account"]["role"] == "student"
        assert data["student"]["school_id"] == "2026-STU-001"

    @pytest.mark.asyncio
    async def test_login_faculty_success(self, client: AsyncClient, demo_accounts):
        """Test successful faculty login."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "faculty@clearanceflow.edu",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["account"]["role"] == "faculty"
        assert data["faculty"] is not None
        assert data["faculty"]["school_id"] == "FAC-2026-088"

    @pytest.mark.asyncio
    async def test_login_admin_success(self, client: AsyncClient, demo_accounts):
        """Test successful superadmin login."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "admin@clearanceflow.edu",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["account"]["role"] == "superadmin"
        assert data["faculty"] is not None
        assert data["faculty"]["is_superadmin"] is True

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "student@clearanceflow.edu",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent user."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "nonexistent@clearanceflow.edu",
                "password": "password123",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_missing_fields(self, client: AsyncClient):
        """Test login with missing fields."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"credential": "student@clearanceflow.edu"},
        )
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, client: AsyncClient, demo_accounts):
        """Test getting current user session with valid token."""
        # First login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "student@clearanceflow.edu",
                "password": "password123",
            },
        )
        token = login_response.json()["token"]

        # Use token to get /me
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["account"]["email"] == "student@clearanceflow.edu"

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Test getting current user session without token."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test getting current user session with invalid token."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_account_with_temporary_password(self, client: AsyncClient, demo_accounts):
        """Test secure admin account creation for a student."""
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "admin@clearanceflow.edu",
                "password": "password123",
            },
        )
        admin_token = admin_login.json()["token"]

        response = await client.post(
            "/api/v1/auth/create-account",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": "newstudent@clearanceflow.edu",
                "role": "student",
                "school_id": "2026-STU-099",
                "department": "cs",
                "year_level": 1,
                "section": "BSCS-1A",
                "password": "TempPass123!",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newstudent@clearanceflow.edu"
        assert data["temporary_password"] == "TempPass123!"
        assert data["must_change_password"] is True

        login = await client.post(
            "/api/v1/auth/login",
            json={
                "credential": "newstudent@clearanceflow.edu",
                "password": "TempPass123!",
            },
        )
        assert login.status_code == 200
        assert login.json()["must_change_password"] is True

    @pytest.mark.asyncio
    async def test_forgot_password_request(self, client: AsyncClient, demo_accounts):
        """Test forgot password request for a real account."""
        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "student@clearanceflow.edu"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password reset instructions sent."
        assert "reset_token" in data

    @pytest.mark.asyncio
    async def test_reset_password_with_valid_token(self, client: AsyncClient, demo_accounts):
        """Test password reset using a valid token."""
        forgot = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "student@clearanceflow.edu"},
        )
        token = forgot.json()["reset_token"]

        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "newPassword123"},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Password reset successfully."

        login = await client.post(
            "/api/v1/auth/login",
            json={"credential": "student@clearanceflow.edu", "password": "newPassword123"},
        )
        assert login.status_code == 200

    @pytest.mark.asyncio
    async def test_reset_password_with_invalid_token(self, client: AsyncClient, demo_accounts):
        """Test password reset rejects invalid tokens."""
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": "invalid-token", "new_password": "newPassword123"},
        )
        assert response.status_code == 401
        assert "Invalid or expired reset token" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient, demo_accounts):
        """Test logout endpoint."""
        response = await client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

    @pytest.mark.asyncio
    async def test_token_refresh(self, client: AsyncClient, demo_accounts):
        """Test token refresh - requires refresh token implementation."""
        # This would need a refresh token endpoint to be fully implemented
        pass