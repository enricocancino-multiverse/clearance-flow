/**
 * ClearanceFlow API Client
 *
 * Connects to the Python (FastAPI) backend at NEXT_PUBLIC_API_URL.
 * The Python layer calls the compiled C++ Kahn's algorithm module for
 * topological sort and priority scoring, then returns results as JSON.
 *
 * All functions return typed promises — swap the stubs below for real
 * fetch calls once the backend is running.
 */

import type {
  AuthSession,
  LoginPayload,
  StudentClearanceView,
  FacultyQueueItem,
  ScheduleSlot,
  Faculty,
  AvailabilityStatus,
  ClearanceRequest,
  GraphState,
  ClearanceNode,
  ClearanceEdge,
  AlgorithmMetrics,
  Account,
  ApiError,
} from "@/types";
import { mockLogin, mockMe, mockLogout } from "@/lib/mockAuth";

// ─── Base Fetch Helper ────────────────────────────────────────────────────────

const BASE =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined) ??
  (typeof window !== "undefined" ? (window as any).__NEXT_PUBLIC_API_URL__ : undefined) ??
  "http://localhost:8000/api/v1";

class ApiRequestError extends Error implements ApiError {
  status: number;
  detail?: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("cf_token") : null;

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiRequestError(res.status, body.message ?? res.statusText, body.detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

const fallbackToMock = async <T>(
  backendCall: () => Promise<T>,
  mockCall: () => Promise<T>,
): Promise<T> => {
  try {
    return await backendCall();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const isNetworkFailure =
      error instanceof TypeError ||
      message.toLowerCase().includes("failed to fetch") ||
      message.toLowerCase().includes("network") ||
      message.toLowerCase().includes("load failed");

    if (isNetworkFailure) {
      return await mockCall();
    }

    throw error;
  }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
// POST /auth/login    → classifies credential (student number / email) server-side
// POST /auth/logout
// GET  /auth/me       → returns session from JWT

export const authApi = {
  login: (payload: LoginPayload) =>
    fallbackToMock(
      () => request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
      () => mockLogin(payload),
    ),

  forgotPassword: (email: string) =>
    fallbackToMock(
      () => request<{ message: string; reset_token?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
      () => import("@/lib/mockAuth").then(({ mockForgotPassword }) => mockForgotPassword(email)),
    ),

  resetPassword: (token: string, newPassword: string) =>
    fallbackToMock(
      () => request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      }),
      () => import("@/lib/mockAuth").then(({ mockResetPassword }) => mockResetPassword(token, newPassword)),
    ),

  logout: () =>
    fallbackToMock(
      () => request<void>("/auth/logout", { method: "POST" }),
      () => mockLogout(),
    ),

  me: () =>
    fallbackToMock(
      () => request<AuthSession>("/auth/me"),
      () => mockMe().then((session) => {
        if (!session) throw new Error("No mock session available");
        return session;
      }),
    ),
};

// ─── Student ──────────────────────────────────────────────────────────────────
// GET /students/:id/clearance  → DAG nodes + statuses + overall progress
// GET /students/:id/schedule   → upcoming sign-off slots

export const studentApi = {
  getClearance: (studentId: string) =>
    request<StudentClearanceView>(`/students/${studentId}/clearance`),

  getSchedule: (studentId: string) =>
    request<ScheduleSlot[]>(`/students/${studentId}/schedule`),
};

// ─── Faculty ──────────────────────────────────────────────────────────────────
// GET   /faculty/:id/queue               → priority-sorted request list
//                                          (Python calls C++ priority scorer)
// PATCH /faculty/:id/availability
// POST  /requests/:id/approve
// POST  /requests/:id/hold

export const facultyApi = {
  getQueue: (facultyId: string) =>
    request<FacultyQueueItem[]>(`/faculty/${facultyId}/queue`),

  setAvailability: (facultyId: string, status: AvailabilityStatus) =>
    request<Faculty>(`/faculty/${facultyId}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  approveRequest: (requestId: string) =>
    request<ClearanceRequest>(`/requests/${requestId}/approve`, { method: "POST" }),

  holdRequest: (requestId: string, reason: string) =>
    request<ClearanceRequest>(`/requests/${requestId}/hold`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ─── SuperAdmin ────────────────────────────────────────────────────────────────
// GET    /admin/graph          → all nodes + rules (current DAG state)
// POST   /admin/nodes          → create node
// DELETE /admin/nodes/:id
// POST   /admin/rules          → create prerequisite rule (edge)
// DELETE /admin/rules/:id
// GET    /admin/metrics        → Kahn's algo profiling data from C++ module
// GET    /admin/users          → all system users

export const adminApi = {
  getGraph: () => request<GraphState>("/admin/graph"),

  addNode: (label: string, office: string, positionX: number, positionY: number) =>
    request<ClearanceNode>("/admin/nodes", {
      method: "POST",
      body: JSON.stringify({ label, office, positionX, positionY }),
    }),

  deleteNode: (nodeId: string) =>
    request<void>(`/admin/nodes/${nodeId}`, { method: "DELETE" }),

  addRule: (fromNodeId: string, toNodeId: string) =>
    request<ClearanceEdge>("/admin/rules", {
      method: "POST",
      body: JSON.stringify({ fromNodeId, toNodeId }),
    }),

  deleteRule: (ruleId: string) =>
    request<void>(`/admin/rules/${ruleId}`, { method: "DELETE" }),

  getMetrics: () => request<AlgorithmMetrics[]>("/admin/metrics"),

  getUsers: () => request<Account[]>("/admin/users"),
};

export { ApiRequestError };