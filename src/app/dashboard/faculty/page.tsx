"use client";

import { DashboardShell } from "../DashboardShell";

export default function FacultyDashboard() {
  return (
    <DashboardShell title="Faculty Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Pending requests</p>
          <p className="mt-2 text-4xl font-bold text-amber-400">3</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Today&apos;s queue</p>
          <p className="mt-2 text-4xl font-bold text-blue-400">5</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Availability</p>
          <p className="mt-2 text-lg font-semibold text-emerald-400">Accepting</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold">Priority queue</h2>
        <p className="mt-2 text-sm text-slate-400">Student clearance requests will appear here.</p>
      </div>
    </DashboardShell>
  );
}
