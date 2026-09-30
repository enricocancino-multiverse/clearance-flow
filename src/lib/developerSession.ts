import type { Account, AuthSession, Faculty, Student, UserRole } from "@/types";

const ACCOUNT_IDS: Record<UserRole, string> = {
  student: "developer-student",
  faculty: "developer-faculty",
  superadmin: "developer-admin",
};

const STUDENT: Student = {
  school_id: "2026-STU-001",
  account_id: ACCOUNT_IDS.student,
  department: "cs",
  year_level: 3,
  section: "BSCS-3A",
  exam_date: "2026-08-28T10:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const FACULTY: Faculty = {
  school_id: "FAC-2026-088",
  account_id: ACCOUNT_IDS.faculty,
  department: "cs",
  is_superadmin: false,
  position: "Department Chair, Computer Science",
  availability: "accepting",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const ADMIN_FACULTY: Faculty = {
  ...FACULTY,
  school_id: "ADM-2026-001",
  account_id: ACCOUNT_IDS.superadmin,
  is_superadmin: true,
  position: "System Administrator",
};

export function createDeveloperSession(role: UserRole): AuthSession {
  const account: Account = {
    account_id: ACCOUNT_IDS[role],
    email: `developer.${role}@clearanceflow.local`,
    role,
    theme_preference: "dark",
    avatar_url: null,
    bio: "Local developer preview account.",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };

  return {
    account,
    student: role === "student" ? STUDENT : undefined,
    faculty: role === "faculty" ? FACULTY : role === "superadmin" ? ADMIN_FACULTY : undefined,
    token: "developer-preview-session",
    expires_at: "2099-12-31T23:59:59.000Z",
  };
}