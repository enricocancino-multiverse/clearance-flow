"use client";
import { useEffect, useState } from "react";
import { DeptKey, DEPT_CONFIG } from "../types";
import { useTheme } from "../context/ThemeContext";
import AccountSettings from "./AccountSettings";
import FacultyGroupChat, { FacultyGroupChatButton } from "./FacultyGroupChat";
import {
  useLiveDashboardState,
  INITIAL_GRAPH_NODES,
  INITIAL_GRAPH_EDGES,
  StudentClearanceStatus,
} from "../lib/liveDashboardState";

interface Props {
  deptName: string;
  deptKey: DeptKey;
  facultyName: string;
  onViewProfile: () => void;
  onFreespace: () => void;
  onSignOut: () => void;
}

interface StudentRequest {
  id: string;
  studentId: string;
  name: string;
  year: string;
  examDate: string;
  submittedAt: string;
  status: "pending" | "approved" | "held";
  priorityScore: number;
  prereqsDone: number;
  prereqsTotal: number;
  holdReason?: string;
}

export default function FacultyDashboard({
  deptName,
  deptKey,
  facultyName,
  onViewProfile,
  onFreespace,
  onSignOut,
}: Props) {
  const { isDark } = useTheme();
  const {
    state,
    setQueue,
    setStudentClearanceStatus,
  } = useLiveDashboardState();
  const cfg = DEPT_CONFIG[deptKey];
  const [studentSearch, setStudentSearch] = useState("");
  const [schedule, setSchedule] = useState(() =>
    state.queue.map(({ id, office, date, time, slot, total }) => ({ id, office, day: date, time, slot, total }))
  );
  const [scheduleDraft, setScheduleDraft] = useState({
    office: cfg.label,
    day: "Wed, Aug 27",
    time: "9:00 – 11:00 AM",
    slot: 3,
    total: 12,
  });
  useEffect(() => {
    setSchedule(state.queue.map(({ id, office, date, time, slot, total }) => ({ id, office, day: date, time, slot, total })));
  }, [state.queue]);

  const removeScheduleEntry = (id: number) => {
    setQueue(state.queue.filter(entry => entry.id !== id));
  };

  const bg = isDark ? "bg-slate-950" : "bg-gray-50";
  const navBg = isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-gray-200";
  const card = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";
  const text = isDark ? "text-slate-100" : "text-slate-900";
  const muted = isDark ? "text-slate-500" : "text-slate-500";
  const graphNodes = state.graphNodes.length ? state.graphNodes : INITIAL_GRAPH_NODES;
  const graphEdges = state.graphEdges.length ? state.graphEdges : INITIAL_GRAPH_EDGES;
  const departmentStudents = Object.values(state.students)
    .filter(student => student.department === deptKey)
    .filter(student => `${student.name} ${student.studentNumber}`.toLowerCase().includes(studentSearch.toLowerCase().trim()))
    .sort((left, right) => left.name.localeCompare(right.name));

  const getClearanceStatus = (studentId: string, nodeId: string): StudentClearanceStatus => {
    const stored = state.studentClearanceRecords[studentId]?.[nodeId];
    if (stored) return stored;
    const request = state.clearanceRequests
      .filter(item => item.studentAccountId === studentId && item.nodeId === nodeId)
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
    if (request?.status === "approved") return "cleared";
    if (request?.status === "held") return "office";
    return graphNodes.find(node => node.id === nodeId)?.status === "completed" ? "cleared" : "pending";
  };

  const isNodeUnlocked = (studentId: string, nodeId: string) =>
    graphEdges
      .filter(edge => edge.to === nodeId)
      .every(edge => getClearanceStatus(studentId, edge.from) === "cleared");

  const hasClearanceToReset = (studentId: string, nodeId: string) => {
    const descendants = new Set([nodeId]);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const edge of graphEdges) {
        if (descendants.has(edge.from) && !descendants.has(edge.to)) {
          descendants.add(edge.to);
          expanded = true;
        }
      }
    }
    return [...descendants].some(id => getClearanceStatus(studentId, id) !== "pending");
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
    setScheduleDraft({
      office: cfg.label,
      day: "Wed, Aug 27",
      time: "9:00 – 11:00 AM",
      slot: 3,
      total: 12,
    });
    setQueue([
      {
        id: nextEntry.id,
        office: nextEntry.office,
        date: nextEntry.day,
        time: nextEntry.time,
        slot: nextEntry.slot,
        total: nextEntry.total,
      },
      ...state.queue,
    ]);
  };

  return (
    <div
      className={`min-h-screen ${bg} transition-colors duration-300`}
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      {/* Header */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-20 ${navBg}`}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
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

          <button
            type="button"
            onClick={onFreespace}
            title="Open Freespace"
            aria-label="Open Freespace"
            className={`hidden rounded-lg px-3 py-2 text-xs font-semibold transition lg:inline-flex ${
              muted
            } hover:bg-emerald-500/10 hover:text-emerald-400`}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="17" cy="7" r="3" />
              <circle cx="7" cy="17" r="3" />
              <circle cx="17" cy="17" r="3" />
              <circle cx="7" cy="7" r="3" />
            </svg>
          </button>
          <FacultyGroupChatButton className={muted} />
          <AccountSettings onCustomizeAccount={onViewProfile} />
          <button
            type="button"
            onClick={onSignOut}
            className={`hidden rounded-lg px-3 py-2 text-xs font-semibold transition lg:inline-flex ${
              muted
            } hover:bg-rose-500/10 hover:text-rose-400`}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <FacultyGroupChat />
        <section className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
            <div>
              <h2 className={`text-sm font-bold ${text}`}>Student Clearances</h2>
              <p className={`text-xs mt-1 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Review each requirement, mark in-person follow-up, or clear it online. Prerequisites control what can be cleared next.
              </p>
            </div>
            <label className="w-full sm:w-72">
              <span className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${muted}`}>Find a student</span>
              <input
                value={studentSearch}
                onChange={event => setStudentSearch(event.target.value)}
                placeholder="Name or student number"
                className={`w-full rounded-lg border px-3 py-2 text-xs ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"}`}
              />
            </label>
          </div>

          {departmentStudents.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-6 text-center text-xs ${isDark ? "border-slate-700" : "border-gray-300"} ${muted}`}>
              {studentSearch
                ? "No students match that search."
                : "Students from this department will appear here when their clearance dashboard is opened on this device."}
            </div>
          ) : (
            <div className="space-y-4">
              {departmentStudents.map(student => (
                <article key={student.accountId} className={`rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50/70"}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className={`text-sm font-semibold truncate ${text}`}>{student.name}</h3>
                      <p className={`text-xs mt-0.5 ${muted}`}>{student.studentNumber}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ color: cfg.color, background: `${cfg.color}18` }}>
                      {cfg.abbr}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {graphNodes.map(node => {
                      const status = getClearanceStatus(student.accountId, node.id);
                      const unlocked = isNodeUnlocked(student.accountId, node.id);
                      const isCleared = status === "cleared" && unlocked;
                      const label = !unlocked ? "Locked — prerequisite needed" : isCleared ? "Cleared online" : status === "office" ? "Office required" : "Pending";

                      return (
                        <div key={node.id} className={`grid grid-cols-1 gap-2 rounded-lg px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${isDark ? "bg-slate-900" : "bg-white"}`}>
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold ${text}`}>{node.label}</div>
                            <div className={`text-[10px] mt-0.5 ${muted}`}>
                              {node.office ?? deptName} · {label}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setStudentClearanceStatus(student.accountId, node.id, "office")}
                              disabled={!unlocked || status === "office"}
                              className="rounded-md border border-amber-500/30 px-2 py-1 text-[10px] font-semibold text-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Require Office
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentClearanceStatus(student.accountId, node.id, "cleared")}
                              disabled={!unlocked || isCleared}
                              className="rounded-md border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Clear Online
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentClearanceStatus(student.accountId, node.id, "pending")}
                              disabled={!hasClearanceToReset(student.accountId, node.id)}
                              className={`rounded-md border px-2 py-1 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "border-slate-700 text-slate-400" : "border-gray-300 text-gray-600"}`}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

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
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{slot.day}</div>
                    <button
                      type="button"
                      onClick={() => removeScheduleEntry(slot.id)}
                      className="rounded-md px-2 py-1 text-[10px] font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label={`Delete ${slot.office} schedule on ${slot.day}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className={`mt-2 text-xs ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>{slot.time}</div>
                <div className={`mt-2 text-[11px] font-mono ${text}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  Queue {slot.slot}/{slot.total}
                </div>
              </div>
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
