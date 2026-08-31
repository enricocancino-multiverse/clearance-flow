# ClearanceFlow Demo Accounts

Quick reference for development, testing, and demo presentations.

---

## Credentials Summary

| Role | Email | School ID | Password |
|------|-------|-----------|----------|
| **Student** | `student@clearanceflow.edu` | `2026-STU-001` | `password123` |
| **Faculty** | `faculty@clearanceflow.edu` | `FAC-2026-088` | `password123` |
| **SuperAdmin** | `admin@clearanceflow.edu` | `ADM-2026-001` | `password123` |

> **Note**: All accounts use the same password (`password123`) for ease of testing. In production, enforce unique strong passwords.

---

## Account Details

### 🎓 Student — `student@clearanceflow.edu`
- **Account ID**: `11111111-1111-1111-1111-111111111111`
- **School ID**: `2026-STU-001`
- **Department**: Computer Science (`cs`)
- **Year Level**: 3
- **Section**: `BSCS-3A`
- **Exam Date**: `2026-08-28` (drives priority scoring)
- **Theme**: Dark
- **Bio**: *Coffee-fueled coder and aspiring software engineer. Loves UI/UX design and building things that matter.*

**Landing Page Detection**: Enter `2026-STU-001` → auto-detected as **Student**

---

### 👨‍🏫 Faculty — `faculty@clearanceflow.edu`
- **Account ID**: `22222222-2222-2222-2222-222222222222`
- **School ID**: `FAC-2026-088`
- **Department**: Computer Science (`cs`)
- **Position**: Department Chair, Computer Science
- **Availability**: `accepting` (toggleable: accepting / in-class / away)
- **Theme**: Dark
- **Bio**: *Ph.D. in Computer Science. Research areas: algorithm design and educational technology. Adviser, JPCS Chapter.*

**Landing Page Detection**: Enter `faculty@clearanceflow.edu` → auto-detected as **Faculty**

---

### 🛡️ SuperAdmin — `admin@clearanceflow.edu`
- **Account ID**: `33333333-3333-3333-3333-333333333333`
- **School ID**: `ADM-2026-001`
- **Department**: Computer Science (`cs`)
- **Position**: System Administrator
- **Is SuperAdmin**: `true`
- **Availability**: `accepting`
- **Theme**: Dark
- **Bio**: *University-wide system administrator for ClearanceFlow.*

**Landing Page Detection**: Enter `admin@clearanceflow.edu` or `superadmin` → auto-detected as **SuperAdmin**

---

## Initialized DAG State (Clearance Dependency Graph)

The seed data populates a **6-node Directed Acyclic Graph** representing the standard university clearance flow:

```
┌─────────┐       ┌─────────┐       ┌──────────┐       ┌────────────┐
│ Library │──────▶│ Finance │──────▶│Dept Head │──────▶│ Registrar  │
│ (done)  │       │(active) │       │ (locked) │       │  (locked)  │
└─────────┘       └─────────┘       └──────────┘       └────────────┘
     │                                        ▲
     │                                        │
     ▼                                        │
┌─────────┐       ┌─────────┐                 │
│ Medical │──────▶│   SAS   │─────────────────┘
│ (done)  │       │(active) │
└─────────┘       └─────────┘
```

### Node Details

| Node ID | Label | Office | Position (x,y) | Prerequisites |
|---------|-------|--------|----------------|---------------|
| `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1` | Library | University Library | (160, 70) | — |
| `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2` | Medical | Health Services Unit | (490, 70) | — |
| `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3` | Finance | Accounting Office | (80, 210) | Library |
| `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4` | SAS | Student Affairs Office | (310, 210) | Library |
| `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5` | Dept Head | Department Office | (195, 360) | Finance, SAS |
| `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6` | Registrar | Registrar's Office | (370, 480) | Dept Head, Medical |

### Edge Rules (Prerequisites)

| From | To | Rule |
|------|-----|------|
| Library | Finance | Must clear Library before Finance |
| Library | SAS | Must clear Library before SAS |
| Finance | Dept Head | Must clear Finance before Dept Head |
| SAS | Dept Head | Must clear SAS before Dept Head |
| Medical | Registrar | Must clear Medical before Registrar |
| Dept Head | Registrar | Must clear Dept Head before Registrar |

---

## Student Clearance Progress (Demo Student)

| Step | Status | Date |
|------|--------|------|
| Library | ✅ **Approved** | Aug 18, 2026 |
| Medical | ✅ **Approved** | Aug 19, 2026 |
| Finance | ⚡ **Pending** (Eligible) | — |
| SAS | ⚡ **Pending** (Eligible) | — |
| Dept Head | 🔒 **Locked** | — |
| Registrar | 🔒 **Locked** | — |

**Overall Progress**: 33% (2/6 completed)

- **Next Eligible Actions**: Finance Office, SAS (both unlocked — Library prerequisite met)
- **Blocked**: Dept Head (needs Finance + SAS), Registrar (needs Dept Head + Medical)

---

## Faculty Queue (Demo Faculty)

Priority-sorted queue for `faculty@clearanceflow.edu` (CS Department Chair):

| Priority | Student | ID | Year | Exam Date | Prereqs | Status |
|----------|---------|-----|------|-----------|---------|--------|
| 94 | Maria Santos | 2024-10042 | 3rd | Aug 28 | 3/4 | Pending |
| 89 | Carlos Reyes | 2023-08810 | 4th | Aug 27 | 5/6 | Pending |
| 78 | Anika Bautista | 2024-10101 | 3rd | Sep 1 | 2/4 | Approved |
| 71 | Jose Miguel Flores | 2023-07714 | 4th | Sep 3 | 4/6 | **Held** (Library) |
| 60 | Patricia Lim | 2024-10350 | 2nd | Sep 5 | 1/4 | Pending |

**Queue Stats**: 5 total · 3 pending · 1 approved · 1 held

---

## Schedule Slots (Upcoming)

| Office | Date | Time | Queue Position / Total |
|--------|------|------|------------------------|
| Accounting Office | Tue, Aug 26 | 9:00 – 11:00 AM | #3 / 12 |
| Student Affairs Office | Tue, Aug 26 | 1:00 – 3:00 PM | #7 / 20 |
| Department Office | Wed, Aug 27 | 10:00 – 12:00 PM | #1 / 8 |
| Registrar's Office | Thu, Aug 28 | 9:00 – 11:00 AM | #5 / 15 |

---

## Algorithm Metrics (Kahn's Topological Sort)

Profiling data from C++ module (simulated):

| Users (n) | Vertices (V) | Edges (E) | Time (ms) | Heap (MB) |
|-----------|--------------|-----------|-----------|-----------|
| 10 | 10 | 12 | 0.38 | 1.20 |
| 50 | 50 | 68 | 1.82 | 4.80 |
| 100 | 100 | 142 | 3.65 | 9.40 |
| 250 | 250 | 360 | 9.12 | 22.10 |
| 500 | 500 | 720 | 18.44 | 43.70 |
| 1000 | 1000 | 1450 | 37.21 | 87.30 |

**Complexity**: O(V+E) — linear scaling confirmed.

---

## Department Load Distribution

| Dept | Students | Pending Clearances | Pending % | Color |
|------|----------|-------------------|-----------|-------|
| CS | 312 | 48 | 15.4% | `#3B82F6` |
| HM | 198 | 27 | 13.6% | `#F97316` |
| CRIM | 245 | 39 | 15.9% | `#EF4444` |
| BSED | 176 | 22 | 12.5% | `#10B981` |
| TVOC | 134 | 18 | 13.4% | `#8B5CF6` |

**University Total**: 1,065 students · 154 active clearances

---

## Quick Test Checklist

- [ ] **Student Login**: `2026-STU-001` / `password123` → redirects to `/dashboard/student`
- [ ] **Faculty Login**: `faculty@clearanceflow.edu` / `password123` → redirects to `/dashboard/faculty`
- [ ] **SuperAdmin Login**: `admin@clearanceflow.edu` / `password123` → redirects to `/dashboard/admin`
- [ ] Student sees: DAG with 2 completed, 2 active, 2 locked nodes
- [ ] Student sees: 2 upcoming schedule slots (Finance, SAS)
- [ ] Faculty sees: 5 requests in priority queue with expandable detail
- [ ] Faculty can: Approve, Hold (with reason), toggle availability
- [ ] SuperAdmin sees: Graph builder (view/draw/delete modes), Metrics charts, User management
- [ ] Theme toggle persists across all dashboards (localStorage)
- [ ] Profile page: Edit bio, avatar, cover photo (all roles)
- [ ] Directory: Search/filter students & faculty

---

## Running the Seed

```bash
# Assuming PostgreSQL running locally
psql -U postgres -d clearanceflow -f db/schema.sql
psql -U postgres -d clearanceflow -f db/seed.sql
```

Or with Docker:
```bash
docker exec -i clearanceflow-db psql -U postgres -d clearanceflow < db/schema.sql
docker exec -i clearanceflow-db psql -U postgres -d clearanceflow < db/seed.sql
```

---

*Generated: 2026-08-27 | ClearanceFlow v2.4.1 | AY 2026–2027*