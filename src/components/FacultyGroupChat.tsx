"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  accountId: string;
  author: string;
  text: string;
  sentAt: string;
}

const STORAGE_KEY = "clearance-flow-faculty-chat";
const UPDATE_EVENT = "clearance-flow-faculty-chat-update";
const OPEN_EVENT = "clearance-flow-faculty-chat-open";

function parseMessages(raw: string): Message[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Saved faculty messages are not a list.");
  return parsed.filter((item): item is Message =>
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    "accountId" in item &&
    "author" in item &&
    "text" in item &&
    "sentAt" in item &&
    typeof item.id === "string" &&
    typeof item.accountId === "string" &&
    typeof item.author === "string" &&
    typeof item.text === "string" &&
    typeof item.sentAt === "string"
  ).slice(-100);
}

export function FacultyGroupChatButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      title="Open faculty group chat"
      aria-label="Open faculty group chat"
      className={`relative rounded-lg p-2 transition hover:bg-blue-500/10 hover:text-blue-400 ${className}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function FacultyGroupChat() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setMessages(raw ? parseMessages(raw) : []);
        setError("");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load faculty messages.");
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) load();
    };
    const handleUpdate = () => load();
    const handleOpen = () => setOpen(true);
    load();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener(OPEN_EVENT, handleOpen);
    };
  }, []);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!session || !["faculty", "superadmin"].includes(session.account.role)) return null;

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (text.length > 500) {
      setError("Messages must be 500 characters or fewer.");
      return;
    }
    const message: Message = {
      id: crypto.randomUUID(),
      accountId: session.account.account_id,
      author: session.account.email.split("@")[0],
      text,
      sentAt: new Date().toISOString(),
    };
    const next = [...messages, message].slice(-100);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMessages(next);
      setDraft("");
      setError("");
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send this message.");
    }
  };

  return (
    open ? (
      <section
        className="fixed bottom-4 right-4 z-50 flex h-[min(480px,calc(100dvh-2rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl shadow-black/40"
        aria-labelledby="faculty-chat-title"
      >
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="faculty-chat-title" className="truncate text-sm font-bold">Faculty group chat</h2>
              <p className="text-[10px] text-slate-500">Faculty and administrators</p>
            </div>
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Minimize chat" title="Minimize">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14" strokeLinecap="round" /></svg>
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close chat" title="Close">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12" strokeLinecap="round" /></svg>
            </button>
          </div>
        </header>
        <div className="custom-scroll flex-1 space-y-3 overflow-y-auto bg-slate-950/60 p-3" aria-live="polite">
          {messages.length === 0
            ? <p className="py-8 text-center text-xs text-slate-600">No messages yet. Start the conversation.</p>
            : messages.map(message => {
              const isOwnMessage = message.accountId === session.account.account_id;
              return (
                <article key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isOwnMessage ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-slate-800 text-slate-200"}`}>
                    {!isOwnMessage && <div className="mb-1 text-[10px] font-bold text-blue-300">{message.author}</div>}
                    <p className="whitespace-pre-wrap wrap-break-word text-xs leading-relaxed">{message.text}</p>
                    <time className={`mt-1 block text-right text-[9px] ${isOwnMessage ? "text-blue-100/70" : "text-slate-500"}`} dateTime={message.sentAt}>
                      {new Date(message.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </time>
                  </div>
                </article>
              );
            })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-800 bg-slate-900 p-3">
          <textarea
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={500}
            rows={1}
            className="max-h-24 min-h-10 min-w-0 flex-1 resize-y rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-blue-500"
            placeholder="Aa"
            aria-label="Faculty group chat message"
          />
          <button type="submit" disabled={!draft.trim()} className="rounded-full p-2.5 text-blue-400 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message" title="Send message">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21.8 12 3.4 3.6l-.1 6.5 13.1 1.9-13.1 1.9.1 6.5Z" /></svg>
          </button>
        </form>
        {error && <p role="alert" className="border-t border-slate-800 px-3 py-2 text-xs text-rose-400">{error}</p>}
      </section>
    ) : null
  );
}
