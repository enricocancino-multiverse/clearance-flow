/**
 * Mock Authentication Layer
 * Simulates backend auth using seeded demo data.
 * Replace with real API calls when FastAPI backend is ready.
 */

import type { AuthSession, LoginPayload, UserRole, Student, Faculty, Account, DeptKey } from "@/types";

// ─── Seeded Demo Data (matches db/seed.sql) ──────────────────────────────────

const DEMO_ACCOUNTS: Record<string, Account & { password: string }> = {
  "student@clearanceflow.edu": {
    account_id: "11111111-1111-1111-1111-111111111111",
    email: "student@clearanceflow.edu",
    role: "student",
    theme_preference: "dark",
    avatar_url: null,
    bio: "Coffee-fueled coder and aspiring software engineer. Loves UI/UX design and building things that matter.",
    password: "password123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  "2026-stu-001": {
    account_id: "11111111-1111-1111-1111-111111111111",
    email: "student@clearanceflow.edu",
    role: "student",
    theme_preference: "dark",
    avatar_url: null,
    bio: "Coffee-fueled coder and aspiring software engineer. Loves UI/UX design and building things that matter.",
    password: "password123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  "faculty@clearanceflow.edu": {
    account_id: "22222222-2222-2222-2222-222222222222",
    email: "faculty@clearanceflow.edu",
    role: "faculty",
    theme_preference: "dark",
    avatar_url: null,
    bio: "Ph.D. in Computer Science. Research areas: algorithm design and educational technology. Adviser, JPCS Chapter.",
    password: "password123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  "admin@clearanceflow.edu": {
    account_id: "33333333-3333-3333-3333-333333333333",
    email: "admin@clearanceflow.edu",
    role: "superadmin",
    theme_preference: "dark",
    avatar_url: null,
    bio: "University-wide system administrator for ClearanceFlow.",
    password: "password123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  "superadmin": {
    account_id: "33333333-3333-3333-3333-333333333333",
    email: "admin@clearanceflow.edu",
    role: "superadmin",
    theme_preference: "dark",
    avatar_url: null,
    bio: "University-wide system administrator for ClearanceFlow.",
    password: "password123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const DEMO_STUDENTS: Record<string, Student> = {
  "11111111-1111-1111-1111-111111111111": {
    school_id: "2026-STU-001",
    account_id: "11111111-1111-1111-1111-111111111111",
    department: "cs",
    year_level: 3,
    section: "BSCS-3A",
    exam_date: "2026-08-28T10:00:00.000Z",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const DEMO_FACULTY: Record<string, Faculty> = {
  "22222222-2222-2222-2222-222222222222": {
    school_id: "FAC-2026-088",
    account_id: "22222222-2222-2222-2222-222222222222",
    department: "cs",
    is_superadmin: false,
    position: "Department Chair, Computer Science",
    availability: "accepting",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  "33333333-3333-3333-3333-333333333333": {
    school_id: "ADM-2026-001",
    account_id: "33333333-3333-3333-3333-333333333333",
    department: "cs",
    is_superadmin: true,
    position: "System Administrator",
    availability: "accepting",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

// ─── JWT Simulation (simple base64, not secure — dev only) ────────────────────

function createMockJWT(accountId: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: accountId, exp: Date.now() + 86400000, iat: Date.now() }));
  const signature = btoa("mock-signature");
  return `${header}.${payload}.${signature}`;
}

function parseMockJWT(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload)).sub;
  } catch {
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function mockLogin(payload: LoginPayload): Promise<AuthSession> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 600));

  const credential = payload.credential.trim().toLowerCase();
  const account = DEMO_ACCOUNTS[credential];

  if (!account || account.password !== payload.password) {
    throw new Error("Invalid credentials. Please try again.");
  }

  const token = createMockJWT(account.account_id);

  let student: Student | undefined;
  let faculty: Faculty | undefined;

  if (account.role === "student") {
    student = DEMO_STUDENTS[account.account_id];
  } else if (account.role === "faculty" || account.role === "superadmin") {
    faculty = DEMO_FACULTY[account.account_id];
  }

  const session: AuthSession = {
    account: { ...account, password: undefined } as Account,
    student,
    faculty,
    token,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("cf_token", token);
  }

  return session;
}

export async function mockMe(): Promise<AuthSession | null> {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("cf_token");
  if (!token) return null;

  const accountId = parseMockJWT(token);
  if (!accountId) {
    localStorage.removeItem("cf_token");
    return null;
  }

  const account = Object.values(DEMO_ACCOUNTS).find((a) => a.account_id === accountId);
  if (!account) {
    localStorage.removeItem("cf_token");
    return null;
  }

  let student: Student | undefined;
  let faculty: Faculty | undefined;

  if (account.role === "student") {
    student = DEMO_STUDENTS[accountId];
  } else {
    faculty = DEMO_FACULTY[accountId];
  }

  return {
    account: { ...account, password: undefined } as Account,
    student,
    faculty,
    token,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  };
}

export async function mockLogout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("cf_token");
  }
}

// ─── Credential Classification (mirrors backend) ──────────────────────────────

export function classifyCredential(credential: string): { view: "student" | "faculty" | "superadmin"; dept: DeptKey } {
  const val = credential.trim().toLowerCase();

  if (/^\d{4}-\d{3,6}$/.test(val) || /^\d{4}-stu-\d{3}$/i.test(val)) {
    const last = parseInt(val.slice(-2), 10);
    const depts: DeptKey[] = ["cs", "hm", "crim", "basiced", "tesda"];
    return { view: "student", dept: depts[last % depts.length] };
  }

  if (val.includes("admin") || val === "superadmin") {
    return { view: "superadmin", dept: "cs" };
  }

  const deptMap: Record<string, DeptKey> = {
    cs: "cs",
    hm: "hm",
    crim: "crim",
    bsed: "basiced",
    tvoc: "tesda",
  };
  const prefix = val.split("@")[0].split(".").pop() ?? "";
  const dept = deptMap[prefix] ?? "cs";
  return { view: "faculty", dept };
}