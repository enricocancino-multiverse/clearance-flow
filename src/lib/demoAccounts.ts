import type { DeptKey, UserRole } from "@/types";

export const DEMO_PASSWORD = "password123";

export interface DemoAccountDefinition {
  accountId: string;
  email: string;
  schoolId: string;
  role: Exclude<UserRole, "superadmin"> | "superadmin";
  department: DeptKey;
  name: string;
  bio: string;
  yearLevel?: number;
  section?: string;
}

export const DEMO_ACCOUNTS: DemoAccountDefinition[] = [
  {
    accountId: "11111111-1111-1111-1111-111111111111",
    email: "student@clearanceflow.edu",
    schoolId: "2026-STU-001",
    role: "student",
    department: "cs",
    name: "Alex Student",
    bio: "Computer Science student exploring software development.",
    yearLevel: 3,
    section: "BSCS-3A",
  },
  {
    accountId: "44444444-4444-4444-4444-444444444444",
    email: "student.hm@clearanceflow.edu",
    schoolId: "2026-STU-002",
    role: "student",
    department: "hm",
    name: "Hana Student",
    bio: "Hospitality Management student.",
    yearLevel: 2,
    section: "BSHM-2A",
  },
  {
    accountId: "55555555-5555-5555-5555-555555555555",
    email: "student.crim@clearanceflow.edu",
    schoolId: "2026-STU-003",
    role: "student",
    department: "crim",
    name: "Chris Student",
    bio: "Criminology student.",
    yearLevel: 2,
    section: "BSCRIM-2A",
  },
  {
    accountId: "66666666-6666-6666-6666-666666666666",
    email: "student.bsed@clearanceflow.edu",
    schoolId: "2026-STU-004",
    role: "student",
    department: "basiced",
    name: "Bea Student",
    bio: "Basic Education student.",
    yearLevel: 2,
    section: "BSED-2A",
  },
  {
    accountId: "77777777-7777-7777-7777-777777777777",
    email: "student.hmt@clearanceflow.edu",
    schoolId: "2026-STU-005",
    role: "student",
    department: "tesda",
    name: "Harper Student",
    bio: "HMT student.",
    yearLevel: 2,
    section: "HMT-2A",
  },
  {
    accountId: "22222222-2222-2222-2222-222222222222",
    email: "faculty@clearanceflow.edu",
    schoolId: "FAC-2026-088",
    role: "faculty",
    department: "cs",
    name: "Casey Faculty",
    bio: "Computer Science faculty member.",
  },
  {
    accountId: "88888888-8888-8888-8888-888888888888",
    email: "faculty.hm@clearanceflow.edu",
    schoolId: "FAC-2026-HM-002",
    role: "faculty",
    department: "hm",
    name: "Morgan Faculty",
    bio: "Hospitality Management faculty member.",
  },
  {
    accountId: "99999999-9999-9999-9999-999999999999",
    email: "faculty.crim@clearanceflow.edu",
    schoolId: "FAC-2026-CRIM-003",
    role: "faculty",
    department: "crim",
    name: "Jordan Faculty",
    bio: "Criminology faculty member.",
  },
  {
    accountId: "aaaaaaaa-aaaa-aaaa-aaaa-000000000001",
    email: "faculty.bsed@clearanceflow.edu",
    schoolId: "FAC-2026-BSED-004",
    role: "faculty",
    department: "basiced",
    name: "Taylor Faculty",
    bio: "Basic Education faculty member.",
  },
  {
    accountId: "bbbbbbbb-bbbb-bbbb-bbbb-000000000002",
    email: "faculty.hmt@clearanceflow.edu",
    schoolId: "FAC-2026-HMT-005",
    role: "faculty",
    department: "tesda",
    name: "Riley Faculty",
    bio: "HMT faculty member.",
  },
  {
    accountId: "33333333-3333-3333-3333-333333333333",
    email: "admin@clearanceflow.edu",
    schoolId: "ADM-2026-001",
    role: "superadmin",
    department: "cs",
    name: "ClearanceFlow Admin",
    bio: "University-wide system administrator for ClearanceFlow.",
  },
];

const departmentFromToken: Record<string, DeptKey> = {
  cs: "cs",
  hm: "hm",
  crim: "crim",
  bsed: "basiced",
  basiced: "basiced",
  hmt: "tesda",
  tesda: "tesda",
};

export function classifyCredential(credential: string): { view: UserRole; dept: DeptKey } | null {
  const value = credential.trim().toLowerCase();
  if (!value) return null;

  const knownAccount = DEMO_ACCOUNTS.find(account =>
    account.email.toLowerCase() === value || account.schoolId.toLowerCase() === value
  );
  if (knownAccount) return { view: knownAccount.role, dept: knownAccount.department };

  if (value === "superadmin" || /^admin@clearanceflow\.edu$/.test(value) || /^adm-\d{4}-\d{3,}$/i.test(value)) {
    return { view: "superadmin", dept: "cs" };
  }
  if (/^\d{4}-stu-\d{3}$/i.test(value) || /^\d{4}-\d{3,6}$/.test(value)) {
    return { view: "student", dept: "cs" };
  }
  if (/^fac-\d{4}-(cs|hm|crim|bsed|hmt|tesda)-\d{3,}$/i.test(value)) {
    const department = value.split("-")[2];
    return { view: "faculty", dept: departmentFromToken[department] ?? "cs" };
  }
  if (/^fac-\d{4}-\d{3,}$/i.test(value)) return { view: "faculty", dept: "cs" };
  if (value.endsWith("@clearanceflow.edu")) {
    const prefix = value.slice(0, value.indexOf("@")).split(/[._-]/);
    const department = prefix.map(token => departmentFromToken[token]).find(Boolean) ?? "cs";
    return { view: "faculty", dept: department };
  }

  return null;
}
