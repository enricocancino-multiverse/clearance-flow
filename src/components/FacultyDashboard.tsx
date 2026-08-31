"use client";
import { useState } from "react";
import { DeptKey, DEPT_CONFIG } from "../types";
import { useTheme } from "../context/ThemeContext";
import { INITIAL_QUEUE, useLiveDashboardState } from "../lib/liveDashboardState";

interface Props {
  deptName: string;
  deptKey: DeptKey;
  facultyName: string;
  onBack: () => void;
  onViewProfile: () => void;
}

type Availability = "accepting" | "in-class" | "away";

interface StudentRequest {
  id: string;
  name: string;
  studentId: string;
  year: string;
  priorityScore: number;
  examDate: string;
  prereqsDone: number;
  prereqsTotal: number;
  status: "pending" | "approved" | "held";
  holdReason?: string;
  submittedAt: string;
}

const STUDENTS: StudentRequest[] = [
  {
    id: "sr1",
    name: "Maria Santos",
    studentId: "2024-10042",
    year: "3rd Year",
    priorityScore: 94,
    examDate: "Aug 28, 2025",
    prereqsDone: 3,
    prereqsTotal: 4,
    status: "pending",
    submittedAt: "2h ago",
  },
  {
    id: "sr2",
    name: "Carlos Reyes",
    studentId: "2023-08810",
    year: "4th Year",
    priorityScore: 89,
    examDate: "Aug 27, 2025",
    prereqsDone: 5,
    prereqsTotal: 6,
    status: "pending",
    submittedAt: "3h ago",
  },
  {
    id: "sr3",
    name: "Anika Bautista",
    studentId: "2024-10101",
    year: "3rd Year",
    priorityScore: 78,
    examDate: "Sep 1, 2025",
    prereqsDone: 2,
    prereqsTotal: 4,
    status: "approved",
    submittedAt: "Yesterday",
  },
  {
    id: "sr4",
    name: "Jose Miguel Flores",
    studentId: "2023-07714",
    year: "4th Year",
    priorityScore: 71,
    examDate: "Sep 3, 2025",
    prereqsDone: 4,
    prereqsTotal: 6,
    status: "held",
    holdReason: "Pending library clearance",
    submittedAt: "Yesterday",
  },
  {
    id: "sr5",
    name: "Patricia Lim",
    studentId: "2024-10350",
    year: "2nd Year",
    priorityScore: 60,
    examDate: "Sep 5, 2025",
    prereqsDone: 1,
    prereqsTotal: 4,
    status: "pending",
    submittedAt: "5h ago",
  },
];

export default function FacultyDashboard({
  deptName,
  deptKey,
  facultyName,
  onBack,
  onViewProfile,
}: Props) {
  const { isDark } = useTheme();
  const { state, setAvailability, setQueue } = useLiveDashboardState();
  const cfg = DEPT_CONFIG[deptKey];
  const [availability, setAvailabilityLocal] = useState<Availability>(state.facultyAvailability as Availability);
  const [students, setStudents] = useState<StudentRequest[]>(STUDENTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState("");
  const [holdTarget, setHoldTarget] = useState<string | null>(null);
  const [schedule, setSchedule] = useState([
    { id: 1, office: "SAS", day: "Tue, Aug 26", time: "1:00 – 3:00 PM", slot: 7, total: 20 },
    { id: 2, office: cfg.label, day: "Wed, Aug 27", time: "9:00 – 11:00 AM", slot: 3, total: 12 },
  ]);
  const [scheduleDraft, setScheduleDraft] = useState({
    office: cfg.label,
    day: "Wed, Aug 27",
    time: "9:00 – 11:00 AM",
    slot: 3,
    total: 12,
  });

  const bg = isDark ? "bg-slate-950" : "bg-gray-50";
  const navBg = isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-gray-200";
  const card = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";
  const text = isDark ? "text-slate-100" : "text-slate-900";
  const muted = isDark ? "text-slate-500" : "text-slate-500";

  const approve = (id: string) => {
    setStudents(s => s.map(x => (x.id === id ? { ...x, status: "approved" } : x)));
    setExpandedId(null);
  };

  const hold = (id: string) => {
    if (!holdReason.trim()) return;
    setStudents(s =>
      s.map(x => (x.id === id ? { ...x, status: "held", holdReason } : x))
    );
    setHoldTarget(null);
    setHoldReason("");
    setExpandedId(null);
  };

  const pending = students.filter(s => s.status === "pending").length;
  const approved = students.filter(s => s.status === "approved").length;
  const held = students.filter(s => s.status === "held").length;

  const handleAvailabilityChange = (next: Availability) => {
    setAvailabilityLocal(next);
    setAvailability(next);
    setQueue(state.queue.length ? state.queue : INITIAL_QUEUE);
  };

  const addScheduleEntry = () => {
    if (!scheduleDraft.office.trim() || !scheduleDraft.day.trim() || !scheduleDraft.time.trim()) return;
    const nextEntry = {
      id: Date.now(),
      office: scheduleDraft.office,
      day: scheduleDraft.day,
      time: scheduleDraft.time,
      slot: Math.max(1, scheduleDraft.slot),
      total: Math.max(1, scheduleDraft.total),
    };
    setSchedule(prev => [nextEntry, ...prev]);
    setScheduleDraft({
      office: cfg.label,
      day: "Wed, Aug 27",
      time: "9:00 – 11:00 AM",
      slot: 3,
      total: 12,
    });
    setQueue([
      {
        id: Date.now() + 1,
        office: nextEntry.office,
        date: nextEntry.day,
        time: nextEntry.time,
        slot: nextEntry.slot,
        total: nextEntry.total,
      },
      ...state.queue,
    ]);
  };

  const availConfig: Record<
    Availability,
    { label: string; color: string; bg: string; icon: string }
  > = {
    accepting: { label: "Accepting Clearances", color: "#10B981", bg: "#052e16", icon: "✓" },
    "in-class": { label: "In Class", color: "#F59E0B", bg: "#2d1f00", icon: "📖" },
    away: { label: "Away", color: "#EF4444", bg: "#1f0808", icon: "—" },
  };
  const avail = availConfig[availability];

  return (
    <div
      className={`min-h-screen ${bg} transition-colors duration-300`}
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      {/* Header */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-20 ${navBg}`}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className={`${muted} hover:${text} transition-colors`}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dept badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={onViewProfile}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white hover:opacity-80 transition-opacity"
              style={{ background: cfg.color }}
            >
              {cfg.abbr}
            </button>
            <div>
              <button
                onClick={onViewProfile}
                className={`text-sm font-bold leading-none hover:underline ${text}`}
              >
                {deptName}
              </button>
              <div className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {facultyName} · Department Chair
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Availability toggle */}
          <div
            className={`flex items-center gap-2 rounded-xl p-1 ${
              isDark ? "bg-slate-800" : "bg-gray-100"
            }`}
          >
            {(["accepting", "in-class", "away"] as Availability[]).map(a => {
              const ac = availConfig[a];
              return (
                <button
                  key={a}
                  onClick={() => handleAvailabilityChange(a)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={
                    availability === a
                      ? { background: ac.bg, color: ac.color, border: `1px solid ${ac.color}44` }
                      : { color: "#64748b" }
                  }
                >
                  {ac.icon} {ac.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className={`text-sm font-bold ${text}`}>Office Schedule Planner</h2>
              <p className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Add your available sign-off windows for students and exam clearances.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              value={scheduleDraft.office}
              onChange={e => setScheduleDraft(prev => ({ ...prev, office: e.target.value }))}
              placeholder="Office"
              className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"}`}
            />
            <input
              value={scheduleDraft.day}
              onChange={e => setScheduleDraft(prev => ({ ...prev, day: e.target.value }))}
              placeholder="Day"
              className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"}`}
            />
            <input
              value={scheduleDraft.time}
              onChange={e => setScheduleDraft(prev => ({ ...prev, time: e.target.value }))}
              placeholder="Time"
              className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"}`}
            />
            <input
              type="number"
              min={1}
              value={scheduleDraft.slot}
              onChange={e => setScheduleDraft(prev => ({ ...prev, slot: Number(e.target.value || 1) }))}
              placeholder="Slot"
              className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"}`}
            />
            <input
              type="number"
              min={1}
              value={scheduleDraft.total}
              onChange={e => setScheduleDraft(prev => ({ ...prev, total: Number(e.target.value || 1) }))}
              placeholder="Total"
              className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"}`}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className={`text-[10px] uppercase tracking-[0.2em] ${muted}`}>
              {schedule.length} active windows
            </div>
            <button
              onClick={addScheduleEntry}
              className="px-4 py-2 rounded-lg text-xs font-bold text-blue-400 border border-blue-900 bg-blue-950/30 hover:bg-blue-950/60 transition-all"
            >
              + Add Schedule
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {schedule.map(slot => (
              <div key={slot.id} className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-xs font-bold ${text}`}>{slot.office}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{slot.day}</div>
                </div>
                <div className={`mt-2 text-xs ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>{slot.time}</div>
                <div className={`mt-2 text-[11px] font-mono ${text}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  Queue {slot.slot}/{slot.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Requests", value: students.length, color: "#94a3b8" },
            { label: "Pending Review", value: pending, color: cfg.color },
            { label: "Approved", value: approved, color: "#10B981" },
            { label: "On Hold", value: held, color: "#F59E0B" },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl border p-4 ${card}`}>
              <div
                className="text-2xl font-bold"
                style={{
                  color: stat.color,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {stat.value}
              </div>
              <div className={`text-xs mt-1 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Priority queue table */}
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? "border-slate-800" : "border-gray-200"
          }`}>
            <div>
              <h2 className={`text-sm font-bold ${text}`}>Priority Queue — Clearance Requests</h2>
              <p className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Sorted by priority score (exam urgency × prerequisites completed)
              </p>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-mono"
              style={{
                background: `${cfg.color}18`,
                color: cfg.color,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {pending} pending
            </div>
          </div>

          {/* Availability warning */}
          {availability !== "accepting" && (
            <div
              className="px-6 py-3 text-xs font-medium flex items-center gap-2"
              style={{
                background: availConfig[availability].bg,
                color: availConfig[availability].color,
              }}
            >
              {availConfig[availability].icon} Status: {availConfig[availability].label} — new clearances are
              paused
            </div>
          )}

          <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-200"}`}>
            {students
              .sort((a, b) => b.priorityScore - a.priorityScore)
              .map(s => (
                <StudentRow
                  key={s.id}
                  student={s}
                  accentColor={cfg.color}
                  expanded={expandedId === s.id}
                  onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  onApprove={() => approve(s.id)}
                  onHoldInit={() => {
                    setHoldTarget(s.id);
                    setExpandedId(s.id);
                  }}
                  holdTarget={holdTarget}
                  holdReason={holdReason}
                  onHoldReasonChange={setHoldReason}
                  onHoldConfirm={() => hold(s.id)}
                  isDark={isDark}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentRow({
  student,
  accentColor,
  expanded,
  onToggle,
  onApprove,
  onHoldInit,
  holdTarget,
  holdReason,
  onHoldReasonChange,
  onHoldConfirm,
  isDark,
}: {
  student: StudentRequest;
  accentColor: string;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onHoldInit: () => void;
  holdTarget: string | null;
  holdReason: string;
  onHoldReasonChange: (v: string) => void;
  onHoldConfirm: () => void;
  isDark: boolean;
}) {
  const statusColors = {
    pending: { bg: "#1e293b", text: "#94a3b8", label: "Pending" },
    approved: { bg: "#052e16", text: "#10B981", label: "Approved" },
    held: { bg: "#2d1f00", text: "#F59E0B", label: "On Hold" },
  };
  const sc = statusColors[student.status];
  const prereqPct = (student.prereqsDone / student.prereqsTotal) * 100;
  const hoverBg = isDark ? "hover:bg-slate-800/40" : "hover:bg-gray-50";

  return (
    <div>
      <div
        className={`px-6 py-4 flex items-center gap-4 transition-colors cursor-pointer ${hoverBg}`}
        onClick={onToggle}
      >
        {/* Priority score */}
        <div className="w-12 text-center shrink-0">
          <div
            className="text-lg font-black font-mono"
            style={{
              color:
                student.priorityScore >= 85
                  ? accentColor
                  : student.priorityScore >= 70
                  ? "#F59E0B"
                  : "#64748b",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {student.priorityScore}
          </div>
          <div className="text-xs text-slate-600" style={{ fontFamily: "Inter, sans-serif" }}>
            score
          </div>
        </div>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ background: `${accentColor}55` }}
        >
          {student.name
            .split(" ")
            .map(w => w[0])
            .slice(0, 2)
            .join("")}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">{student.name}</div>
          <div className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            {student.studentId} · {student.year} · Exam: {student.examDate}
          </div>
        </div>

        {/* Prerequisites bar */}
        <div className="hidden sm:flex flex-col gap-1 items-end shrink-0">
          <div className="text-xs text-slate-500" style={{ fontFamily: "Inter, sans-serif" }}>
            {student.prereqsDone}/{student.prereqsTotal} prereqs
          </div>
          <div className={`w-24 h-1.5 rounded-full ${isDark ? "bg-slate-800" : "bg-gray-200"}`}>
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${prereqPct}%` }} />
          </div>
        </div>

        {/* Status */}
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0" style={{ background: sc.bg, color: sc.text }}>
          {sc.label}
        </span>

        <div className="text-xs text-slate-600 shrink-0" style={{ fontFamily: "Inter, sans-serif" }}>
          {student.submittedAt}
        </div>

        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div
          className={`px-6 pb-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 ${
            isDark ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50"
          }`}
        >
          {/* Dependency tree preview */}
          <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800" : "bg-white border border-gray-200"}`}>
            <div className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-gray-500"} mb-2`}>
              Dependency Tree
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Library", done: true },
                { label: "Medical", done: true },
                { label: "Finance", done: student.prereqsDone >= 3 },
                { label: "SAS", done: student.prereqsDone >= 4 },
                { label: "Dept Head", done: student.prereqsDone >= 5 },
              ].map(dep => (
                <div key={dep.label} className="flex items-center gap-2 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      dep.done ? "bg-emerald-500" : isDark ? "bg-slate-600" : "bg-gray-300"
                    }`}
                  />
                  <span className={dep.done ? (isDark ? "text-slate-300" : "text-gray-700") : (isDark ? "text-slate-600" : "text-gray-500")}>
                    {dep.label}
                  </span>
                  {dep.done && <span className="text-emerald-500 text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {student.status === "pending" && (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onApprove();
                  }}
                  className="py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "#10B981" }}
                >
                  ✓ Approve & Sign
                </button>
                {holdTarget !== student.id ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onHoldInit();
                    }}
                    className="py-2.5 rounded-xl text-sm font-bold text-amber-400 border border-amber-900 bg-amber-950/40 hover:bg-amber-950/70 transition-all"
                  >
                    ⏸ Hold with Reason
                  </button>
                ) : (
                  <div onClick={e => e.stopPropagation()}>
                    <textarea
                      value={holdReason}
                      onChange={e => onHoldReasonChange(e.target.value)}
                      placeholder="Enter hold reason…"
                      rows={2}
                      className={`w-full rounded-lg px-3 py-2 text-xs outline-none resize-none mb-2 ${
                        isDark
                          ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-600 focus:border-amber-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-400"
                      } border`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                    <button
                      onClick={onHoldConfirm}
                      className="w-full py-2 rounded-lg text-xs font-bold text-amber-400 border border-amber-800 hover:bg-amber-950 transition-all"
                    >
                      Confirm Hold
                    </button>
                  </div>
                )}
              </>
            )}
            {student.status === "held" && (
              <div className="bg-amber-950/30 rounded-xl p-3 border border-amber-900/50">
                <div className="text-xs font-semibold text-amber-400 mb-1">Hold Reason</div>
                <div className="text-xs text-amber-200/70" style={{ fontFamily: "Inter, sans-serif" }}>
                  {student.holdReason}
                </div>
              </div>
            )}
            {student.status === "approved" && (
              <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-900/50 text-center">
                <div className="text-emerald-400 font-bold text-sm">✓ Clearance Signed</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
