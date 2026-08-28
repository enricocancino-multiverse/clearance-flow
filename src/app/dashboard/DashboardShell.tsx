"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const { session, loading, logout } = useAuth();

  if (loading) {
    return <main className="min-h-screen bg-slate-950 text-white p-8">Loading...</main>;
  }

  if (!session) {
    router.replace("/");
    return null;
  }

  const profile = session.student ?? session.faculty;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "Outfit, sans-serif" }}>
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div>
            <p className="text-sm font-bold text-white">ClearanceFlow</p>
            <h1 className="mt-0.5 text-xs text-slate-500">{title}</h1>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/");
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">{session.account.email.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="text-sm font-semibold text-white">{session.account.email}</p>
            <p className="mt-0.5 text-xs text-slate-500">
            {profile && "school_id" in profile ? profile.school_id : session.account.role}
            </p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
