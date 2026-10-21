"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-08-28

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    user_role_enum = postgresql.ENUM(
        "student", "faculty", "superadmin",
        name="user_role",
        create_type=True,
    )
    user_role_enum.create(op.get_bind(), checkfirst=True)

    theme_preference_enum = postgresql.ENUM(
        "light", "dark",
        name="theme_preference",
        create_type=True,
    )
    theme_preference_enum.create(op.get_bind(), checkfirst=True)

    department_enum = postgresql.ENUM(
        "cs", "hm", "crim", "basiced", "tesda",
        name="department",
        create_type=True,
    )
    department_enum.create(op.get_bind(), checkfirst=True)

    availability_status_enum = postgresql.ENUM(
        "accepting", "in-class", "away",
        name="availability_status",
        create_type=True,
    )
    availability_status_enum.create(op.get_bind(), checkfirst=True)

    clearance_status_enum = postgresql.ENUM(
        "pending", "approved", "held", "locked",
        name="clearance_status",
        create_type=True,
    )
    clearance_status_enum.create(op.get_bind(), checkfirst=True)

    # Create accounts table
    op.create_table(
        "accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("role", user_role_enum, nullable=False, server_default="student"),
        sa.Column("theme_preference", theme_preference_enum, nullable=False, server_default="dark"),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_accounts_email", "accounts", ["email"], unique=True)

    # Create students table
    op.create_table(
        "students",
        sa.Column("school_id", sa.String(50), primary_key=True, nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("department", department_enum, nullable=False),
        sa.Column("year_level", sa.Integer(), nullable=False),
        sa.Column("section", sa.String(20), nullable=False),
        sa.Column("exam_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_students_account_id", "students", ["account_id"], unique=True)

    # Create faculty table
    op.create_table(
        "faculty",
        sa.Column("school_id", sa.String(50), primary_key=True, nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("department", department_enum, nullable=False),
        sa.Column("is_superadmin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("position", sa.String(100), nullable=False),
        sa.Column("availability", availability_status_enum, nullable=False, server_default="accepting"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_faculty_account_id", "faculty", ["account_id"], unique=True)

    # Create clearance_nodes table
    op.create_table(
        "clearance_nodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("office", sa.String(200), nullable=False),
        sa.Column("position_x", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("position_y", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create clearance_edges table
    op.create_table(
        "clearance_edges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("from_node_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("to_node_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["from_node_id"], ["clearance_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["to_node_id"], ["clearance_nodes.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_clearance_edges_from_node_id", "clearance_edges", ["from_node_id"])
    op.create_index("ix_clearance_edges_to_node_id", "clearance_edges", ["to_node_id"])
    op.create_unique_constraint("uq_clearance_edge", "clearance_edges", ["from_node_id", "to_node_id"])

    # Create clearance_requests table
    op.create_table(
        "clearance_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("student_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("node_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("faculty_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", clearance_status_enum, nullable=False, server_default="pending"),
        sa.Column("hold_reason", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["student_account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["node_id"], ["clearance_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["faculty_account_id"], ["accounts.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_clearance_requests_student_account_id", "clearance_requests", ["student_account_id"])
    op.create_index("ix_clearance_requests_node_id", "clearance_requests", ["node_id"])
    op.create_index("ix_clearance_requests_faculty_account_id", "clearance_requests", ["faculty_account_id"])

    # Create schedule_slots table
    op.create_table(
        "schedule_slots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("office", sa.String(200), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("time_start", sa.String(5), nullable=False),
        sa.Column("time_end", sa.String(5), nullable=False),
        sa.Column("queue_position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("queue_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("faculty_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["faculty_account_id"], ["accounts.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_schedule_slots_date", "schedule_slots", ["date"])
    op.create_index("ix_schedule_slots_faculty_account_id", "schedule_slots", ["faculty_account_id"])

    # Create algorithm_metrics table
    op.create_table(
        "algorithm_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("execution_time_ms", sa.Integer(), nullable=False),
        sa.Column("vertex_count", sa.Integer(), nullable=False),
        sa.Column("edge_count", sa.Integer(), nullable=False),
        sa.Column("heap_usage_mb", sa.Float(), nullable=False),
        sa.Column("simulated_user_count", sa.Integer(), nullable=False),
        sa.Column("complexity", sa.String(50), nullable=False, server_default="O((V+E) log V)"),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_algorithm_metrics_recorded_at", "algorithm_metrics", ["recorded_at"])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table("algorithm_metrics")
    op.drop_table("schedule_slots")
    op.drop_table("clearance_requests")
    op.drop_table("clearance_edges")
    op.drop_table("clearance_nodes")
    op.drop_table("faculty")
    op.drop_table("students")
    op.drop_table("accounts")

    # Drop enum types
    clearance_status_enum = postgresql.ENUM(name="clearance_status")
    clearance_status_enum.drop(op.get_bind(), checkfirst=True)

    availability_status_enum = postgresql.ENUM(name="availability_status")
    availability_status_enum.drop(op.get_bind(), checkfirst=True)

    department_enum = postgresql.ENUM(name="department")
    department_enum.drop(op.get_bind(), checkfirst=True)

    theme_preference_enum = postgresql.ENUM(name="theme_preference")
    theme_preference_enum.drop(op.get_bind(), checkfirst=True)

    user_role_enum = postgresql.ENUM(name="user_role")
    user_role_enum.drop(op.get_bind(), checkfirst=True)