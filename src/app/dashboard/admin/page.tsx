"use client";

import { DashboardShell } from "../DashboardShell";

export default function AdminDashboard() {
  return (
    <DashboardShell title="Administrator Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Registered users</p>
          <p className="mt-2 text-4xl font-bold text-blue-400">128</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Graph nodes</p>
          <p className="mt-2 text-4xl font-bold text-emerald-400">6</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">System status</p>
          <p className="mt-2 text-lg font-semibold text-emerald-400">Operational</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold">Clearance graph management</h2>
        <p className="mt-2 text-sm text-slate-400">Manage offices, prerequisite rules, users, and algorithm metrics.</p>
      </div>
    </DashboardShell>
  );
}
