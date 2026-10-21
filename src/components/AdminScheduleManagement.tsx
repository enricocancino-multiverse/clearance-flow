"use client";

import { useState, type FormEvent } from "react";
import { useLiveDashboardState, type QueueEntry } from "../lib/liveDashboardState";

interface Props {
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
}

export default function AdminScheduleManagement({ isDark, card, text, muted }: Props) {
  const { state, setQueue } = useLiveDashboardState();
  const [draft, setDraft] = useState({ office: "", date: "", time: "", slot: "0", total: "1" });
  const [error, setError] = useState("");

  const addSchedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const office = draft.office.trim();
    const slot = Number(draft.slot);
    const total = Number(draft.total);
    if (!office || !draft.date || !draft.time || !Number.isInteger(slot) || !Number.isInteger(total) || slot < 0 || total < 1 || slot > total) {
      setError("Enter an office, date, time, and valid capacity (0 ≤ appointments ≤ capacity).");
      return;
    }
    const entry: QueueEntry = { id: Date.now(), office, date: draft.date, time: draft.time, slot, total };
    setQueue([...state.queue, entry]);
    setDraft({ office: "", date: "", time: "", slot: "0", total: "1" });
    setError("");
  };

  const removeSchedule = (id: number) => setQueue(state.queue.filter(entry => entry.id !== id));

  return (
    <section className={`rounded-2xl border p-6 ${card}`}>
      <div className="mb-5">
        <h2 className={`text-lg font-bold ${text}`}>University clearance scheduling</h2>
        <p className={`mt-1 text-xs ${muted}`}>Create or remove office appointment windows for in-person clearance meetings. Changes sync to the student and faculty dashboards in this browser.</p>
      </div>

      <form onSubmit={addSchedule} className="grid gap-3 rounded-xl border border-slate-700/60 bg-slate-950/20 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className={`text-xs ${muted} lg:col-span-2`}>Office or department
          <input value={draft.office} onChange={event => setDraft({ ...draft, office: event.target.value })} maxLength={80} required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-950 text-white" : "border-gray-300 bg-white text-gray-900"}`} />
        </label>
        <label className={`text-xs ${muted}`}>Date
          <input type="date" value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-950 text-white" : "border-gray-300 bg-white text-gray-900"}`} />
        </label>
        <label className={`text-xs ${muted}`}>Time window
          <input value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} placeholder="9:00–11:00 AM" maxLength={40} required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-950 text-white" : "border-gray-300 bg-white text-gray-900"}`} />
        </label>
        <label className={`text-xs ${muted}`}>Booked slots
          <input type="number" min="0" step="1" value={draft.slot} onChange={event => setDraft({ ...draft, slot: event.target.value })} required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-950 text-white" : "border-gray-300 bg-white text-gray-900"}`} />
        </label>
        <label className={`text-xs ${muted}`}>Capacity
          <input type="number" min="1" step="1" value={draft.total} onChange={event => setDraft({ ...draft, total: event.target.value })} required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-950 text-white" : "border-gray-300 bg-white text-gray-900"}`} />
        </label>
        <div className="sm:col-span-2 lg:col-span-6">
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500">Add appointment window</button>
          {error && <p role="alert" className="mt-2 text-xs text-rose-400">{error}</p>}
        </div>
      </form>

      <div className="mt-5 space-y-2">
        {state.queue.length === 0 && <p className={`rounded-xl border border-dashed p-6 text-center text-sm ${muted}`}>No appointment windows have been scheduled.</p>}
        {state.queue.map(entry => (
          <article key={entry.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
            <div>
              <h3 className={`text-sm font-semibold ${text}`}>{entry.office}</h3>
              <p className={`mt-1 text-xs ${muted}`}>{entry.date} · {entry.time} · {entry.slot}/{entry.total} booked</p>
            </div>
            <button type="button" onClick={() => removeSchedule(entry.id)} className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10">Remove</button>
          </article>
        ))}
      </div>
    </section>
  );
}
