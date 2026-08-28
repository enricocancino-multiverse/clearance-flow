"use client";

import { DashboardShell } from "../DashboardShell";

const steps = [
  { name: "Library", office: "University Library", status: "completed", x: 120, y: 60 },
  { name: "Medical", office: "Health Services Unit", status: "completed", x: 420, y: 60 },
  { name: "Finance", office: "Accounting Office", status: "active", x: 65, y: 190 },
  { name: "OSAS", office: "Student Affairs Office", status: "active", x: 270, y: 190 },
  { name: "Dept Head", office: "Department Office", status: "locked", x: 165, y: 320 },
  { name: "Registrar", office: "Registrar's Office", status: "locked", x: 330, y: 445 },
];

const edges = [[0, 2], [0, 3], [2, 4], [3, 4], [1, 5], [4, 5]];

export default function StudentDashboard() {
  return (
    <DashboardShell title="Student Dashboard">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Clearance Dependency Graph</h2>
              <p className="mt-0.5 text-xs text-slate-500">Kahn&apos;s Topological Sort · directed acyclic graph</p>
            </div>
            <div className="hidden gap-3 text-xs text-slate-500 sm:flex"><span className="text-emerald-400">● Completed</span><span className="text-blue-400">● Active</span><span>● Locked</span></div>
          </div>
          <svg viewBox="0 0 500 500" className="w-full p-5" aria-label="Clearance dependency graph">
            {edges.map(([from, to]) => <line key={`${from}-${to}`} x1={steps[from].x} y1={steps[from].y} x2={steps[to].x} y2={steps[to].y} stroke={steps[from].status === "completed" ? "#10B981" : "#334155"} strokeWidth="2" />)}
            {steps.map((step) => { const color = step.status === "completed" ? "#10B981" : step.status === "active" ? "#3B82F6" : "#475569"; return <g key={step.name}><circle cx={step.x} cy={step.y} r="30" fill="#0f172a" stroke={color} strokeWidth="2" /><circle cx={step.x} cy={step.y} r="20" fill={`${color}22`} /><text x={step.x} y={step.y + 5} textAnchor="middle" fontSize="14" fill={color}>{step.status === "completed" ? "✓" : step.status === "active" ? "•" : "🔒"}</text><text x={step.x} y={step.y + 48} textAnchor="middle" fontSize="11" fontWeight="600" fill={color}>{step.name}</text></g>; })}
          </svg>
          <div className="grid grid-cols-3 gap-2 px-6 pb-5 sm:grid-cols-6">
            {steps.map((step) => <div key={step.name} className="rounded-lg border border-slate-800 bg-slate-800/50 p-2 text-center"><div className="truncate text-xs font-semibold text-slate-300">{step.name}</div><div className={step.status === "completed" ? "text-emerald-400" : step.status === "active" ? "text-blue-400" : "text-slate-500"}>{step.status === "completed" ? "✓" : step.status === "active" ? "⚡" : "🔒"}</div></div>)}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Clearance Status</h2>
            <div className="space-y-3">{steps.map((step) => <div key={step.name} className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${step.status === "completed" ? "bg-emerald-500" : step.status === "active" ? "bg-blue-500" : "bg-slate-700"}`} /><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-slate-300">{step.name}</div><div className="truncate text-xs text-slate-600">{step.office}</div></div><span className="text-xs text-slate-500">{step.status === "completed" ? "Done" : step.status === "active" ? "Active" : "Locked"}</span></div>)}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Assigned Sign-Off Windows</h2><span className="font-mono text-xs text-slate-500">2 upcoming</span></div>
            <div className="mt-3 space-y-3">{[["Accounting Office", "Tue, Aug 26 · 9:00 – 11:00 AM", "#3/12"], ["Student Affairs Office", "Tue, Aug 26 · 1:00 – 3:00 PM", "#7/20"]].map(([office, time, queue]) => <div key={office} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3"><div className="text-xs font-bold text-white">{office}</div><div className="mt-1 text-xs text-slate-400">{time}</div><div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-slate-800"><div className="h-full w-1/4 rounded-full bg-blue-500" /></div><span className="font-mono text-xs text-slate-400">{queue}</span></div></div>)}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-sm font-semibold text-white">Next Action</h2><p className="mt-2 text-xs leading-relaxed text-slate-400">Visit <span className="font-medium text-white">Finance Office</span> or <span className="font-medium text-white">OSAS</span>. Both are eligible.</p><button className="mt-3 w-full rounded-lg bg-blue-500 py-2 text-xs font-bold text-white hover:bg-blue-400">View Office Hours</button></div>
        </div>
      </div>
    </DashboardShell>
  );
}
