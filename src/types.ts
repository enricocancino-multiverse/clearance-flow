// ─── Core Enums ────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'superadmin';
export type DeptKey = 'cs' | 'hm' | 'crim' | 'basiced' | 'tesda';
export type ClearanceStatus = 'pending' | 'approved' | 'held' | 'locked';
export type AvailabilityStatus = 'accepting' | 'in-class' | 'away';
export type ThemePreference = 'light' | 'dark';

export const DEPT_CONFIG: Record<DeptKey, { label: string; color: string; light: string; abbr: string }> = {
  cs:      { label: 'Computer Science',       color: '#38BDF8', light: '#BAE6FD', abbr: 'CS'   },
  hm:      { label: 'Hospitality Management', color: '#F97316', light: '#FFEDD5', abbr: 'HM'   },
  crim:    { label: 'Criminology',             color: '#EF4444', light: '#FEE2E2', abbr: 'CRIM' },
  basiced: { label: 'Basic Education',         color: '#10B981', light: '#D1FAE5', abbr: 'BSED' },
  tesda:   { label: 'HMT',                     color: '#1E3A8A', light: '#DBEAFE', abbr: 'HMT'  },
};

// ─── Dual-ID System: PostgreSQL Table Shapes ───────────────────────────────────
// Each interface maps 1-to-1 with a DB table row (snake_case → camelCase).
// account_id (UUID v4) is the primary auth identity.
// school_id (string) is the human-readable institutional identifier.

export interface Account {
  account_id: string;              // UUID v4 PRIMARY KEY
  email: string;                   // unique, not null
  role: UserRole;
  department?: DeptKey | null;
  theme_preference: ThemePreference;
  avatar_url: string | null;       // optional profile image
  bio: string | null;              // optional short description
  created_at: string;              // ISO 8601 timestamp
  updated_at: string;              // ISO 8601 timestamp
}

export interface Student {
  school_id: string;               // PK — e.g. "2026-STU-001"
  account_id: string;              // FK → accounts.account_id (unique)
  department: DeptKey;
  year_level: number;              // 1–4
  section: string;                 // e.g. "BSCS-3A"
  exam_date: string | null;        // ISO 8601 — drives priority scoring
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  school_id: string;               // PK — e.g. "FAC-2026-088"
  account_id: string;              // FK → accounts.account_id (unique)
  department: DeptKey;
  is_superadmin: boolean;          // true for superadmin faculty
  position: string;                // e.g. "Department Chair"
  availability: AvailabilityStatus;
  created_at: string;
  updated_at: string;
}

// ─── Clearance DAG Structures ──────────────────────────────────────────────────

export interface ClearanceNode {
  id: string;                      // UUID v4 PRIMARY KEY
  label: string;                   // e.g. "Library"
  office: string;                  // e.g. "University Library"
  position_x: number;              // canvas X for graph visualizer
  position_y: number;              // canvas Y for graph visualizer
  created_at: string;              // ISO 8601
}

export interface ClearanceEdge {
  id: string;                      // UUID v4 PRIMARY KEY
  from_node_id: string;            // FK → clearance_nodes.id (prerequisite)
  to_node_id: string;              // FK → clearance_nodes.id (dependent)
  created_at: string;              // ISO 8601
}

// ─── Clearance Requests ────────────────────────────────────────────────────────

export interface ClearanceRequest {
  id: string;                      // UUID v4 PRIMARY KEY
  student_account_id: string;      // FK → accounts.account_id (student)
  node_id: string;                 // FK → clearance_nodes.id
  faculty_account_id: string | null; // FK → accounts.account_id (processor)
  status: ClearanceStatus;
  hold_reason: string | null;
  submitted_at: string;            // ISO 8601
  approved_at: string | null;      // ISO 8601
}

// ─── Schedule & Queue ──────────────────────────────────────────────────────────

export interface ScheduleSlot {
  id: string;
  office: string;
  date: string;                    // ISO 8601 date
  time_start: string;              // "09:00"
  time_end: string;                // "11:00"
  queue_position: number;
  queue_total: number;
}

// ─── Algorithm Metrics ─────────────────────────────────────────────────────────

export interface AlgorithmMetrics {
  id: string;
  execution_time_ms: number;
  vertex_count: number;
  edge_count: number;
  heap_usage_mb: number;
  simulated_user_count: number;
  complexity: string;              // "O((V+E) log V)" with heap-based greedy tie-breaking
  recorded_at: string;             // ISO 8601
}

// ─── Composite / View Types (assembled by API layer) ───────────────────────────

export interface StudentClearanceView {
  student: Student & { account: Account };
  nodes: Array<ClearanceNode & { status: ClearanceStatus }>;
  overall_progress: number;        // 0–100
  schedule: ScheduleSlot[];
}

export interface FacultyQueueItem {
  request: ClearanceRequest;
  student: Student & { account: Account };
  priority_score: number;          // computed by Python/C++ priority engine
  prereqs_done: number;
  prereqs_total: number;
}

export interface GraphState {
  nodes: ClearanceNode[];
  edges: ClearanceEdge[];
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthSession {
  account: Account;
  student?: Student;               // populated when role === 'student'
  faculty?: Faculty;               // populated when role === 'faculty' or 'superadmin'
  token: string;                   // JWT — stored in localStorage / httpOnly cookie
  expires_at: string;              // ISO 8601
}

export interface LoginPayload {
  credential: string;              // school_id OR email
  password: string;
}

// ─── API Response Wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

// ─── UI / View Types ───────────────────────────────────────────────────────────

export type ViewType = 'landing' | 'student' | 'faculty' | 'superadmin' | 'profile' | 'directory';

export interface ProfileData {
  id: string;                      // account_id
  name: string;
  role: UserRole;
  dept: DeptKey;
  school_id?: string;              // student or faculty school_id
  email?: string;
  year_level?: number;
  section?: string;
  position?: string;
  bio: string;
  avatar_url: string | null;
  cover_url: string | null;
  highlights: { id: string; url: string; caption: string }[];
  joined_at: string;
}