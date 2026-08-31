-- ClearanceFlow Database Schema
-- PostgreSQL 15+ compatible
-- Dual-ID System: account_id (UUID v4) + school_id (human-readable string)

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Core Tables ──────────────────────────────────────────────────────────────

-- accounts: central authentication identity (one per person)
CREATE TABLE accounts (
    account_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    role              VARCHAR(20)  NOT NULL CHECK (role IN ('student', 'faculty', 'superadmin')),
    theme_preference  VARCHAR(10)  NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark')),
    avatar_url        VARCHAR(500),
    bio               TEXT,
    password_hash     VARCHAR(255) NOT NULL,  -- bcrypt/argon2 hash
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_role ON accounts(role);

-- departments: canonical department registry for organized admin views
CREATE TABLE departments (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,
    label           VARCHAR(80) NOT NULL,
    category        VARCHAR(30) NOT NULL CHECK (category IN ('academic', 'general', 'system')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departments_category ON departments(category);

-- academic_years: school year archive and current active year support
CREATE TABLE academic_years (
    id              SERIAL PRIMARY KEY,
    school_year     VARCHAR(9) NOT NULL UNIQUE CHECK (school_year ~ '^\d{4}-\d{4}$'),
    start_year      SMALLINT NOT NULL CHECK (start_year >= 2024),
    end_year        SMALLINT NOT NULL CHECK (end_year = start_year + 1),
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_academic_years_active ON academic_years(is_active);

-- students: academic profile linked to account
CREATE TABLE students (
    school_id           VARCHAR(50) PRIMARY KEY,           -- e.g. '2026-STU-001'
    account_id          UUID NOT NULL UNIQUE REFERENCES accounts(account_id) ON DELETE CASCADE,
    department          VARCHAR(20) NOT NULL CHECK (department IN ('cs', 'hm', 'crim', 'basiced', 'tesda')),
    department_group    VARCHAR(40) NOT NULL DEFAULT 'academic' CHECK (department_group IN ('computer-science', 'criminology', 'general-education', 'technology-vocational')),
    academic_year       VARCHAR(9) NOT NULL DEFAULT '2026-2027' CHECK (academic_year ~ '^\d{4}-\d{4}$'),
    year_level          SMALLINT NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    section             VARCHAR(20) NOT NULL,              -- e.g. 'BSCS-3A'
    exam_date           TIMESTAMPTZ,                       -- drives priority scoring
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_academic_year ON students(academic_year);
CREATE INDEX idx_students_department_group ON students(department_group);

CREATE INDEX idx_students_account_id ON students(account_id);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_exam_date ON students(exam_date);

-- faculty: staff profile linked to account
CREATE TABLE faculty (
    school_id           VARCHAR(50) PRIMARY KEY,           -- e.g. 'FAC-2026-088' or 'ADM-2026-001'
    account_id          UUID NOT NULL UNIQUE REFERENCES accounts(account_id) ON DELETE CASCADE,
    department          VARCHAR(20) NOT NULL CHECK (department IN ('cs', 'hm', 'crim', 'basiced', 'tesda')),
    department_group    VARCHAR(40) NOT NULL DEFAULT 'faculty' CHECK (department_group IN ('computer-science', 'criminology', 'general-education', 'technology-vocational', 'faculty')),
    academic_year       VARCHAR(9) NOT NULL DEFAULT '2026-2027' CHECK (academic_year ~ '^\d{4}-\d{4}$'),
    is_superadmin       BOOLEAN NOT NULL DEFAULT FALSE,
    position            VARCHAR(100) NOT NULL,             -- e.g. 'Department Chair'
    availability        VARCHAR(20) NOT NULL DEFAULT 'accepting' CHECK (availability IN ('accepting', 'in-class', 'away')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faculty_account_id ON faculty(account_id);
CREATE INDEX idx_faculty_department ON faculty(department);
CREATE INDEX idx_faculty_department_group ON faculty(department_group);
CREATE INDEX idx_faculty_academic_year ON faculty(academic_year);
CREATE INDEX idx_faculty_is_superadmin ON faculty(is_superadmin);

CREATE TABLE student_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       VARCHAR(50) NOT NULL REFERENCES students(school_id) ON DELETE CASCADE,
    academic_year  VARCHAR(9) NOT NULL CHECK (academic_year ~ '^\d{4}-\d{4}$'),
    year_level      SMALLINT NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    department      VARCHAR(20) NOT NULL CHECK (department IN ('cs', 'hm', 'crim', 'basiced', 'tesda')),
    section         VARCHAR(20) NOT NULL,
    batch_label     VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, academic_year)
);

CREATE INDEX idx_student_batches_year ON student_batches(academic_year);
CREATE INDEX idx_student_batches_department ON student_batches(department);
CREATE INDEX idx_student_batches_year_level ON student_batches(year_level);

-- ─── Clearance DAG Tables ─────────────────────────────────────────────────────

-- clearance_nodes: each clearance office/step in the graph
CREATE TABLE clearance_nodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label           VARCHAR(100) NOT NULL,             -- e.g. 'Library'
    office          VARCHAR(150) NOT NULL,             -- e.g. 'University Library'
    position_x      INTEGER NOT NULL,                  -- canvas X for graph visualizer
    position_y      INTEGER NOT NULL,                  -- canvas Y for graph visualizer
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- clearance_edges: prerequisite rules (directed edges)
CREATE TABLE clearance_edges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id    UUID NOT NULL REFERENCES clearance_nodes(id) ON DELETE CASCADE,
    to_node_id      UUID NOT NULL REFERENCES clearance_nodes(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (from_node_id, to_node_id)
);

CREATE INDEX idx_clearance_edges_from ON clearance_edges(from_node_id);
CREATE INDEX idx_clearance_edges_to ON clearance_edges(to_node_id);

-- ─── Clearance Requests ───────────────────────────────────────────────────────

CREATE TABLE clearance_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_account_id      UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    node_id                 UUID NOT NULL REFERENCES clearance_nodes(id) ON DELETE CASCADE,
    faculty_account_id      UUID REFERENCES accounts(account_id) ON DELETE SET NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'held', 'locked')),
    hold_reason             TEXT,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at             TIMESTAMPTZ,
    UNIQUE (student_account_id, node_id)
);

CREATE INDEX idx_clearance_requests_student ON clearance_requests(student_account_id);
CREATE INDEX idx_clearance_requests_node ON clearance_requests(node_id);
CREATE INDEX idx_clearance_requests_status ON clearance_requests(status);
CREATE INDEX idx_clearance_requests_faculty ON clearance_requests(faculty_account_id);

-- ─── Schedule Slots ───────────────────────────────────────────────────────────

CREATE TABLE schedule_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office          VARCHAR(150) NOT NULL,
    date            DATE NOT NULL,
    time_start      TIME NOT NULL,
    time_end        TIME NOT NULL,
    queue_position  INTEGER NOT NULL DEFAULT 0,
    queue_total     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_slots_date ON schedule_slots(date);
CREATE INDEX idx_schedule_slots_office ON schedule_slots(office);

-- ─── Algorithm Metrics ────────────────────────────────────────────────────────

CREATE TABLE algorithm_metrics (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_time_ms       INTEGER NOT NULL,
    vertex_count            INTEGER NOT NULL,
    edge_count              INTEGER NOT NULL,
    heap_usage_mb           NUMERIC(10,2) NOT NULL,
    simulated_user_count    INTEGER NOT NULL,
    complexity              VARCHAR(50) NOT NULL,          -- e.g. 'O(V+E)'
    recorded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_algorithm_metrics_recorded_at ON algorithm_metrics(recorded_at);

-- ─── Updated At Trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at    BEFORE UPDATE ON accounts    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at    BEFORE UPDATE ON students    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_updated_at     BEFORE UPDATE ON faculty     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Helper Views ─────────────────────────────────────────────────────────────

-- student_with_account: join for easy querying
CREATE VIEW student_with_account AS
SELECT
    s.school_id,
    s.department,
    s.year_level,
    s.section,
    s.exam_date,
    a.account_id,
    a.email,
    a.role,
    a.theme_preference,
    a.avatar_url,
    a.bio,
    a.created_at AS account_created_at,
    a.updated_at AS account_updated_at
FROM students s
JOIN accounts a ON s.account_id = a.account_id;

-- faculty_with_account: join for easy querying
CREATE VIEW faculty_with_account AS
SELECT
    f.school_id,
    f.department,
    f.is_superadmin,
    f.position,
    f.availability,
    a.account_id,
    a.email,
    a.role,
    a.theme_preference,
    a.avatar_url,
    a.bio,
    a.created_at AS account_created_at,
    a.updated_at AS account_updated_at
FROM faculty f
JOIN accounts a ON f.account_id = a.account_id;

-- clearance_request_detail: request with student/account info
CREATE VIEW clearance_request_detail AS
SELECT
    cr.id,
    cr.student_account_id,
    cr.node_id,
    cr.faculty_account_id,
    cr.status,
    cr.hold_reason,
    cr.submitted_at,
    cr.approved_at,
    cn.label AS node_label,
    cn.office AS node_office,
    cn.position_x,
    cn.position_y,
    sa.email AS student_email,
    sa.school_id AS student_school_id,
    sa.department AS student_department,
    sa.year_level,
    sa.section
FROM clearance_requests cr
JOIN clearance_nodes cn ON cr.node_id = cn.id
JOIN student_with_account sa ON cr.student_account_id = sa.account_id;