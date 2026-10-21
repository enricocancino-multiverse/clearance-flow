-- ClearanceFlow Database Seed Data
-- Run AFTER schema.sql
-- Passwords are bcrypt hashed with cost 12 (all passwords = "password123")
-- Demo credentials mirror src/lib/demoAccounts.ts.

-- ─── Demo Accounts ────────────────────────────────────────────────────────────
-- Password hash for "password123" (bcrypt cost 12)
-- Generated: bcrypt.hashSync('password123', 12)

INSERT INTO accounts (account_id, email, role, theme_preference, avatar_url, bio, password_hash, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'student@clearanceflow.edu', 'student', 'dark', NULL, 'Computer Science student exploring software development.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'student.hm@clearanceflow.edu', 'student', 'dark', NULL, 'Hospitality Management student.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'student.crim@clearanceflow.edu', 'student', 'dark', NULL, 'Criminology student.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'student.bsed@clearanceflow.edu', 'student', 'dark', NULL, 'Basic Education student.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'student.hmt@clearanceflow.edu', 'student', 'dark', NULL, 'HMT student.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'faculty@clearanceflow.edu', 'faculty', 'dark', NULL, 'Computer Science faculty member.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'faculty.hm@clearanceflow.edu', 'faculty', 'dark', NULL, 'Hospitality Management faculty member.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'faculty.crim@clearanceflow.edu', 'faculty', 'dark', NULL, 'Criminology faculty member.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'faculty.bsed@clearanceflow.edu', 'faculty', 'dark', NULL, 'Basic Education faculty member.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'faculty.hmt@clearanceflow.edu', 'faculty', 'dark', NULL, 'HMT faculty member.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'admin@clearanceflow.edu', 'superadmin', 'dark', NULL, 'University-wide system administrator for ClearanceFlow.', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ─── Student Profiles ─────────────────────────────────────────────────────────
INSERT INTO students (school_id, account_id, department, year_level, section, exam_date, created_at, updated_at) VALUES
('2026-STU-001', '11111111-1111-1111-1111-111111111111', 'cs', 3, 'BSCS-3A', '2026-08-28 10:00:00+00', NOW(), NOW()),
('2026-STU-002', '44444444-4444-4444-4444-444444444444', 'hm', 2, 'BSHM-2A', NULL, NOW(), NOW()),
('2026-STU-003', '55555555-5555-5555-5555-555555555555', 'crim', 2, 'BSCRIM-2A', NULL, NOW(), NOW()),
('2026-STU-004', '66666666-6666-6666-6666-666666666666', 'basiced', 2, 'BSED-2A', NULL, NOW(), NOW()),
('2026-STU-005', '77777777-7777-7777-7777-777777777777', 'tesda', 2, 'HMT-2A', NULL, NOW(), NOW())
ON CONFLICT (school_id) DO NOTHING;

-- ─── Faculty Profiles ─────────────────────────────────────────────────────────
INSERT INTO faculty (school_id, account_id, department, is_superadmin, position, availability, created_at, updated_at) VALUES
('FAC-2026-088', '22222222-2222-2222-2222-222222222222', 'cs', FALSE, 'Department Chair, Computer Science', 'accepting', NOW(), NOW()),
('FAC-2026-HM-002', '88888888-8888-8888-8888-888888888888', 'hm', FALSE, 'Department Faculty, Hospitality Management', 'accepting', NOW(), NOW()),
('FAC-2026-CRIM-003', '99999999-9999-9999-9999-999999999999', 'crim', FALSE, 'Department Faculty, Criminology', 'accepting', NOW(), NOW()),
('FAC-2026-BSED-004', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'basiced', FALSE, 'Department Faculty, Basic Education', 'accepting', NOW(), NOW()),
('FAC-2026-HMT-005', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'tesda', FALSE, 'Department Faculty, HMT', 'accepting', NOW(), NOW()),
('ADM-2026-001', '33333333-3333-3333-3333-333333333333', 'cs', TRUE, 'System Administrator', 'accepting', NOW(), NOW())
ON CONFLICT (school_id) DO NOTHING;

-- ─── Clearance DAG Nodes ──────────────────────────────────────────────────────
-- Standard clearance flow: Library → Finance, SAS → Dept Head → Registrar
-- Medical → Registrar (parallel path)

INSERT INTO clearance_nodes (id, label, office, position_x, position_y, created_at) VALUES
-- Row 1: Entry points (no prerequisites)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Library',      'University Library',          160,  70, NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Medical',      'Health Services Unit',        490,  70, NOW()),

-- Row 2: Depends on Library
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Finance',      'Accounting Office',            80, 210, NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'SAS',          'Student Affairs Office',       310, 210, NOW()),

-- Row 3: Depends on Finance + SAS
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Dept Head',    'Department Office',            195, 360, NOW()),

-- Row 4: Depends on Dept Head + Medical
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Registrar',    'Registrar\'s Office',          370, 480, NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── Clearance DAG Edges (Prerequisite Rules) ─────────────────────────────────
INSERT INTO clearance_edges (id, from_node_id, to_node_id, created_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),  -- Library → Finance
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', NOW()),  -- Library → SAS
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', NOW()),  -- Finance → Dept Head
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', NOW()),  -- SAS → Dept Head
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', NOW()),  -- Medical → Registrar
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', NOW())   -- Dept Head → Registrar
ON CONFLICT (id) DO NOTHING;

-- ─── Initial Clearance Requests for Demo Student ──────────────────────────────
-- Student has completed Library & Medical, currently at Finance & SAS
INSERT INTO clearance_requests (id, student_account_id, node_id, faculty_account_id, status, hold_reason, submitted_at, approved_at) VALUES
-- Completed: Library
('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 'approved', NULL, '2026-08-18 10:00:00+00', '2026-08-18 10:30:00+00'),

-- Completed: Medical
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'approved', NULL, '2026-08-19 09:00:00+00', '2026-08-19 09:45:00+00'),

-- Active: Finance (eligible - Library done)
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NULL, 'pending', NULL, '2026-08-26 08:00:00+00', NULL),

-- Active: SAS (eligible - Library done)
('cccccccc-cccc-cccc-cccc-ccccccccccc4', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', NULL, 'pending', NULL, '2026-08-26 08:00:00+00', NULL),

-- Locked: Dept Head (needs Finance + SAS)
('cccccccc-cccc-cccc-cccc-ccccccccccc5', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', NULL, 'locked', NULL, NULL, NULL),

-- Locked: Registrar (needs Dept Head + Medical)
('cccccccc-cccc-cccc-cccc-ccccccccccc6', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', NULL, 'locked', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── Schedule Slots ───────────────────────────────────────────────────────────
INSERT INTO schedule_slots (id, office, date, time_start, time_end, queue_position, queue_total, created_at) VALUES
('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'Accounting Office',      '2026-08-26', '09:00:00', '11:00:00', 3,  12, NOW()),
('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'Student Affairs Office', '2026-08-26', '13:00:00', '15:00:00', 7,  20, NOW()),
('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'Department Office',      '2026-08-27', '10:00:00', '12:00:00', 1,  8,  NOW()),
('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'Registrar\'s Office',    '2026-08-28', '09:00:00', '11:00:00', 5,  15, NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── Algorithm Metrics (Historical Profiling Data) ────────────────────────────
INSERT INTO algorithm_metrics (id, execution_time_ms, vertex_count, edge_count, heap_usage_mb, simulated_user_count, complexity, recorded_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 0.38,  10,   12,  1.20,  10,   'O(V+E)', NOW() - INTERVAL '6 hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 1.82,  50,   68,  4.80,  50,   'O(V+E)', NOW() - INTERVAL '5 hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 3.65,  100,  142, 9.40,  100,  'O(V+E)', NOW() - INTERVAL '4 hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 9.12,  250,  360, 22.10, 250,  'O(V+E)', NOW() - INTERVAL '3 hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 18.44, 500,  720, 43.70, 500,  'O(V+E)', NOW() - INTERVAL '2 hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 37.21, 1000, 1450, 87.30, 1000, 'O(V+E)', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;