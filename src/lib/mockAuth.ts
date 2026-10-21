/**
 * Mock Authentication Layer
 * Provides development fallback authentication using the shared demo accounts.
 */

import type { AuthSession, LoginPayload, UserRole, Student, Faculty, Account, DeptKey } from "@/types";
import { DEMO_ACCOUNTS as DEMO_ACCOUNT_DEFINITIONS, DEMO_PASSWORD } from "@/lib/demoAccounts";
export { classifyCredential } from "@/lib/demoAccounts";

// ─── Seeded demo accounts (matches backend/init-db/02-seed-data.sql) ──────────

const now = new Date().toISOString();
const DEMO_ACCOUNTS: Record<string, Account & { password: string }> = {};
const DEMO_STUDENTS: Record<string, Student> = {};
const DEMO_FACULTY: Record<string, Faculty> = {};

for (const definition of DEMO_ACCOUNT_DEFINITIONS) {
  const account: Account & { password: string } = {
    account_id: definition.accountId,
    email: definition.email,
    role: definition.role,
    department: definition.department,
    theme_preference: "dark",
    avatar_url: null,
    bio: definition.bio,
    password: DEMO_PASSWORD,
    created_at: now,
    updated_at: now,
  };
  DEMO_ACCOUNTS[definition.email.toLowerCase()] = account;
  DEMO_ACCOUNTS[definition.schoolId.toLowerCase()] = account;

  if (definition.role === "student") {
    DEMO_STUDENTS[definition.accountId] = {
      school_id: definition.schoolId,
      account_id: definition.accountId,
      department: definition.department,
      year_level: definition.yearLevel ?? 1,
      section: definition.section ?? "DEMO-1A",
      exam_date: definition.department === "cs" ? "2026-08-28T10:00:00.000Z" : null,
      created_at: now,
      updated_at: now,
    };
  } else {
    DEMO_FACULTY[definition.accountId] = {
      school_id: definition.schoolId,
      account_id: definition.accountId,
      department: definition.department,
      is_superadmin: definition.role === "superadmin",
      position: definition.role === "superadmin"
        ? "System Administrator"
        : `Department Faculty, ${definition.department}`,
      availability: "accepting",
      created_at: now,
      updated_at: now,
    };
  }
}

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

export async function mockForgotPassword(email: string): Promise<{ message: string; reset_token: string }> {
  await new Promise((r) => setTimeout(r, 400));

  const account = Object.values(DEMO_ACCOUNTS).find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!account) {
    return {
      message: "Password reset instructions sent.",
      reset_token: "local-dev-only-token",
    };
  }

  const token = createMockJWT(account.account_id);
  return {
    message: "Password reset instructions sent.",
    reset_token: token,
  };
}

export async function mockResetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  await new Promise((r) => setTimeout(r, 400));

  const accountId = parseMockJWT(token);
  if (!accountId) {
    throw new Error("Invalid or expired reset token");
  }

  const account = Object.values(DEMO_ACCOUNTS).find((a) => a.account_id === accountId);
  if (!account) {
    throw new Error("Invalid or expired reset token");
  }

  account.password = newPassword;
  return { message: "Password reset successfully." };
}

export async function mockUpdateAccount(
  accountId: string,
  updates: Partial<Pick<Account, "theme_preference" | "avatar_url" | "bio">>,
): Promise<Account> {
  const account = Object.values(DEMO_ACCOUNTS).find(item => item.account_id === accountId);
  if (!account) throw new Error("Account not found.");
  Object.assign(account, updates, { updated_at: new Date().toISOString() });
  return {
    account_id: account.account_id,
    email: account.email,
    role: account.role,
    theme_preference: account.theme_preference,
    avatar_url: account.avatar_url,
    bio: account.bio,
    created_at: account.created_at,
    updated_at: account.updated_at,
  };
}

export async function mockChangePassword(
  accountId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const account = Object.values(DEMO_ACCOUNTS).find(item => item.account_id === accountId);
  if (!account || account.password !== currentPassword) {
    throw new Error("Current password is incorrect.");
  }
  account.password = newPassword;
  return { message: "Password changed successfully." };
}

export async function mockListAccounts(): Promise<Account[]> {
  const uniqueAccounts = new Map<string, Account>();
  for (const account of Object.values(DEMO_ACCOUNTS)) {
    if (!uniqueAccounts.has(account.account_id)) {
      uniqueAccounts.set(account.account_id, {
        account_id: account.account_id,
        email: account.email,
        role: account.role,
        department: DEMO_STUDENTS[account.account_id]?.department ?? DEMO_FACULTY[account.account_id]?.department ?? null,
        theme_preference: account.theme_preference,
        avatar_url: account.avatar_url,
        bio: account.bio,
        created_at: account.created_at,
        updated_at: account.updated_at,
      });
    }
  }
  return [...uniqueAccounts.values()];
}

export async function mockCreateAccount(payload: {
  email: string;
  password: string;
  role: "student" | "faculty";
  school_id: string;
  department: DeptKey;
  year_level?: number;
  section?: string;
}): Promise<{ account_id: string; email: string; role: string; school_id: string; temporary_password: string; must_change_password: boolean }> {
  const email = payload.email.trim().toLowerCase();
  if (Object.values(DEMO_ACCOUNTS).some(account => account.email.toLowerCase() === email)) {
    throw new Error("Account already exists.");
  }

  const now = new Date().toISOString();
  const accountId = crypto.randomUUID();
  DEMO_ACCOUNTS[email] = {
    account_id: accountId,
    email,
    role: payload.role,
    theme_preference: "dark",
    avatar_url: null,
    bio: null,
    password: payload.password,
    created_at: now,
    updated_at: now,
  };
  DEMO_ACCOUNTS[payload.school_id.toLowerCase()] = DEMO_ACCOUNTS[email];

  if (payload.role === "student") {
    DEMO_STUDENTS[accountId] = {
      school_id: payload.school_id.toUpperCase(),
      account_id: accountId,
      department: payload.department,
      year_level: payload.year_level ?? 1,
      section: payload.section ?? "BSCS-1A",
      exam_date: null,
      created_at: now,
      updated_at: now,
    };
  } else {
    DEMO_FACULTY[accountId] = {
      school_id: payload.school_id.toUpperCase(),
      account_id: accountId,
      department: payload.department,
      is_superadmin: false,
      position: "Faculty Member",
      availability: "accepting",
      created_at: now,
      updated_at: now,
    };
  }

  return {
    account_id: accountId,
    email,
    role: payload.role,
    school_id: payload.school_id.toUpperCase(),
    temporary_password: payload.password,
    must_change_password: true,
  };
}

export async function mockDeleteAccount(accountId: string): Promise<void> {
  const target = Object.values(DEMO_ACCOUNTS).find(account => account.account_id === accountId);
  if (!target) throw new Error("Account not found.");
  if (target.role === "superadmin") throw new Error("Administrator accounts cannot be deleted from this demo.");

  for (const [credential, account] of Object.entries(DEMO_ACCOUNTS)) {
    if (account.account_id === accountId) delete DEMO_ACCOUNTS[credential];
  }
  delete DEMO_STUDENTS[accountId];
  delete DEMO_FACULTY[accountId];
}
