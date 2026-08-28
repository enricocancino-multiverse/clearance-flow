-- Seed demo data for ClearanceFlow
-- This matches the mock data in frontend/src/lib/mockAuth.ts

-- Password hash for "password123" with bcrypt rounds=12
-- Generated with: python -c "from passlib.context import CryptContext; pwd = CryptContext(schemes=['bcrypt'], deprecated='auto', bcrypt__rounds=12); print(pwd.hash('password123'))"
-- $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S

DO $$
DECLARE
    student_account_id UUID := '11111111-1111-1111-1111-111111111111';
    faculty_account_id UUID := '22222222-2222-2222-2222-222222222222';
    admin_account_id UUID := '33333333-3333-3333-3333-333333333333';
    password_hash TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S';
BEGIN
    -- Insert accounts
    INSERT INTO accounts (id, email, role, theme_preference, avatar_url, bio, hashed_password, created_at, updated_at)
    VALUES
        (student_account_id, 'student@clearanceflow.edu', 'student', 'dark', NULL,
         'Coffee-fueled coder and aspiring software engineer. Loves UI/UX design and building things that matter.',
         password_hash, NOW(), NOW()),
        (faculty_account_id, 'faculty@clearanceflow.edu', 'faculty', 'dark', NULL,
         'Ph.D. in Computer Science. Research areas: algorithm design and educational technology. Adviser, JPCS Chapter.',
         password_hash, NOW(), NOW()),
        (admin_account_id, 'admin@clearanceflow.edu', 'superadmin', 'dark', NULL,
         'University-wide system administrator for ClearanceFlow.',
         password_hash, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;

    -- Insert student profile
    INSERT INTO students (school_id, account_id, department, year_level, section, exam_date, created_at, updated_at)
    VALUES
        ('2026-STU-001', student_account_id, 'cs', 3, 'BSCS-3A', '2026-08-28 10:00:00+00', NOW(), NOW())
    ON CONFLICT (school_id) DO NOTHING;

    -- Insert faculty profiles
    INSERT INTO faculty (school_id, account_id, department, is_superadmin, position, availability, created_at, updated_at)
    VALUES
        ('FAC-2026-088', faculty_account_id, 'cs', FALSE, 'Department Chair, Computer Science', 'accepting', NOW(), NOW()),
        ('ADM-2026-001', admin_account_id, 'cs', TRUE, 'System Administrator', 'accepting', NOW(), NOW())
    ON CONFLICT (school_id) DO NOTHING;

    -- Insert clearance nodes (DAG nodes)
    INSERT INTO clearance_nodes (id, label, office, position_x, position_y, created_at)
    VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Registrar', 'Office of the Registrar', 100, 100, NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Library', 'University Library', 300, 100, NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Finance', 'Finance Office', 500, 100, NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Clinic', 'University Clinic', 700, 100, NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Guidance', 'Guidance Office', 100, 300, NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Department', 'CS Department Office', 300, 300, NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'Adviser', 'Academic Adviser', 500, 300, NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'OSA', 'Office of Student Affairs', 700, 300, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insert clearance edges (prerequisites)
    -- Registrar -> Library -> Finance -> Clinic
    -- Registrar -> Guidance -> Department -> Adviser -> OSA
    INSERT INTO clearance_edges (id, from_node_id, to_node_id, created_at)
    VALUES
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insert sample clearance requests for the demo student
    INSERT INTO clearance_requests (id, student_account_id, node_id, status, submitted_at, created_at, updated_at)
    VALUES
        ('cccccccc-cccc-cccc-cccc-ccccccccccc1', student_account_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'approved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
        ('cccccccc-cccc-cccc-cccc-ccccccccccc2', student_account_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'approved', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
        ('cccccccc-cccc-cccc-cccc-ccccccccccc3', student_account_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'pending', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
        ('cccccccc-cccc-cccc-cccc-ccccccccccc4', student_account_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'approved', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
        ('cccccccc-cccc-cccc-cccc-ccccccccccc5', student_account_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'pending', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
    ON CONFLICT (id) DO NOTHING;

    -- Insert schedule slots
    INSERT INTO schedule_slots (id, office, date, time_start, time_end, queue_position, queue_total, faculty_account_id, created_at, updated_at)
    VALUES
        ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'Office of the Registrar', CURRENT_DATE + INTERVAL '1 day', '09:00', '11:00', 3, 15, faculty_account_id, NOW(), NOW()),
        ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'University Library', CURRENT_DATE + INTERVAL '1 day', '13:00', '15:00', 1, 10, faculty_account_id, NOW(), NOW()),
        ('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'Finance Office', CURRENT_DATE + INTERVAL '2 day', '09:00', '12:00', 0, 8, faculty_account_id, NOW(), NOW()),
        ('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'CS Department Office', CURRENT_DATE + INTERVAL '2 day', '13:00', '16:00', 2, 12, faculty_account_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insert sample algorithm metrics
    INSERT INTO algorithm_metrics (id, execution_time_ms, vertex_count, edge_count, heap_usage_mb, simulated_user_count, complexity, recorded_at)
    VALUES
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 12, 8, 7, 0.5, 100, 'O(V+E)', NOW() - INTERVAL '1 hour'),
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 15, 8, 7, 0.5, 200, 'O(V+E)', NOW() - INTERVAL '30 minutes'),
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 11, 8, 7, 0.5, 150, 'O(V+E)', NOW() - INTERVAL '10 minutes')
    ON CONFLICT (id) DO NOTHING;

END $$;