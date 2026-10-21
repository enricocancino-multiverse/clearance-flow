"""
Pytest configuration and fixtures.
"""

import asyncio
import uuid
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool

from app.core.config import Settings
from app.core.database import get_session
from app.main import app
from app.models import Base


# Test database URL (use SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture(scope="function")
async def client(test_session) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client with overridden dependencies."""

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield test_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def test_settings() -> Settings:
    """Test settings instance."""
    return Settings(
        DATABASE_URL=TEST_DATABASE_URL,
        SECRET_KEY="test-secret-key-for-testing-only-min-32-chars",
        DEBUG=True,
        ENVIRONMENT="test",
        CORS_ORIGINS=["http://localhost:3000"],
    )


# ─── Test Data Fixtures ──────────────────────────────────────────────────────

@pytest.fixture
async def demo_accounts(test_session: AsyncSession):
    """Create demo accounts for testing."""
    from app.core.security import get_password_hash
    from app.models.account import Account, Faculty, Student, UserRole, Department

    password_hash = get_password_hash("password123")

    # Student account
    student_account = Account(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="student@clearanceflow.edu",
        role=UserRole.STUDENT,
        hashed_password=password_hash,
    )

    # Faculty account
    faculty_account = Account(
        id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
        email="faculty@clearanceflow.edu",
        role=UserRole.FACULTY,
        hashed_password=password_hash,
    )

    # Admin account
    admin_account = Account(
        id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
        email="admin@clearanceflow.edu",
        role=UserRole.SUPERADMIN,
        hashed_password=password_hash,
    )

    test_session.add_all([student_account, faculty_account, admin_account])
    await test_session.flush()

    # Student profile
    student = Student(
        school_id="2026-STU-001",
        account_id=student_account.id,
        department=Department.CS,
        year_level=3,
        section="BSCS-3A",
    )

    # Faculty profile
    faculty = Faculty(
        school_id="FAC-2026-088",
        account_id=faculty_account.id,
        department=Department.CS,
        is_superadmin=False,
        position="Department Chair",
    )

    admin_faculty = Faculty(
        school_id="ADM-2026-001",
        account_id=admin_account.id,
        department=Department.CS,
        is_superadmin=True,
        position="System Administrator",
    )

    test_session.add_all([student, faculty, admin_faculty])
    await test_session.commit()

    return {
        "student_account": student_account,
        "faculty_account": faculty_account,
        "admin_account": admin_account,
        "student": student,
        "faculty": faculty,
        "admin_faculty": admin_faculty,
    }


@pytest.fixture
async def demo_clearance_graph(test_session: AsyncSession):
    """Create demo clearance DAG for testing."""
    from app.models.clearance import ClearanceEdge, ClearanceNode
    nodes = [
        ClearanceNode(
            id=uuid.uuid4(),
            label="Registrar",
            office="Office of the Registrar",
            position_x=100,
            position_y=100,
        ),
        ClearanceNode(
            id=uuid.uuid4(),
            label="Library",
            office="University Library",
            position_x=300,
            position_y=100,
        ),
        ClearanceNode(
            id=uuid.uuid4(),
            label="Finance",
            office="Finance Office",
            position_x=500,
            position_y=100,
        ),
        ClearanceNode(
            id=uuid.uuid4(),
            label="Department",
            office="CS Department Office",
            position_x=300,
            position_y=300,
        ),
    ]

    test_session.add_all(nodes)
    await test_session.flush()

    # Create edges: Registrar -> Library -> Finance, Registrar -> Department
    edges = [
        ClearanceEdge(
            id=uuid.uuid4(),
            from_node_id=nodes[0].id,
            to_node_id=nodes[1].id,
        ),
        ClearanceEdge(
            id=uuid.uuid4(),
            from_node_id=nodes[1].id,
            to_node_id=nodes[2].id,
        ),
        ClearanceEdge(
            id=uuid.uuid4(),
            from_node_id=nodes[0].id,
            to_node_id=nodes[3].id,
        ),
    ]

    test_session.add_all(edges)
    await test_session.commit()

    return {"nodes": nodes, "edges": edges}