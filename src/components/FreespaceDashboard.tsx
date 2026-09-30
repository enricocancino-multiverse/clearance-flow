"use client";

import { useMemo, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import StudentDirectory from "@/components/StudentDirectory";
import type { ProfileData } from "@/components/ProfilePage";

interface Props {
  currentUserId: string;
  currentUserName: string;
  onBack: () => void;
  onViewProfile?: (profile: ProfileData) => void;
  initialView?: "feed" | "directory";
}

type Post = {
  id: string;
  authorId: string;
  author: string;
  initials: string;
  tone: string;
  time: string;
  text: string;
  reactions: number;
  comments: number;
  liked: boolean;
};

type ChatMessage = {
  id: string;
  authorId: string;
  author: string;
  initials: string;
  text: string;
  time: string;
};

const INITIAL_POSTS: Post[] = [
  {
    id: "post-1",
    authorId: "u3",
    author: "Anika Bautista",
    initials: "AB",
    tone: "from-cyan-400 to-blue-500",
    time: "18 min ago",
    text: "The library has the quiet corner by the windows again. 10/10 study spot, 0/10 available outlets.",
    reactions: 24,
    comments: 6,
    liked: false,
  },
  {
    id: "post-2",
    authorId: "u7",
    author: "Angelica Mendoza",
    initials: "AM",
    tone: "from-amber-300 to-orange-500",
    time: "43 min ago",
    text: "Anyone up for a sunset walk after the last class? I found a tiny coffee place near the south gate.",
    reactions: 17,
    comments: 11,
    liked: true,
  },
  {
    id: "post-3",
    authorId: "u10",
    author: "Jerome Soriano",
    initials: "JS",
    tone: "from-violet-400 to-fuchsia-500",
    time: "1 hr ago",
    text: "Reminder that the open mic sign-up closes tonight. Bring a poem, a song, or just a friend who will cheer loudly.",
    reactions: 31,
    comments: 8,
    liked: false,
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: "chat-1", authorId: "u1", author: "Maria", initials: "MS", text: "Good luck to everyone finishing clearances this week!", time: "now" },
  { id: "chat-2", authorId: "u8", author: "Michael", initials: "MA", text: "Is the west gate still open after 6?", time: "2 min" },
  { id: "chat-3", authorId: "u4", author: "Jose Miguel", initials: "JF", text: "Yep, just bring your ID. Security is chill today.", time: "1 min" },
];

const announcement = {
  title: "Clearance week is here",
  body: "All offices are open until 6:00 PM this week. Check your clearance graph before lining up so you only make the trip you need.",
  meta: "Campus announcement · 2 hours ago",
};

export default function FreespaceDashboard({ currentUserId, currentUserName, onBack, onViewProfile, initialView = "feed" }: Props) {
  const { isDark, toggle } = useTheme();
  const [activeView, setActiveView] = useState<"feed" | "directory">(initialView);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [chat, setChat] = useState(INITIAL_CHAT);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [postDraft, setPostDraft] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);
  const [reportReason, setReportReason] = useState("Spam or misleading content");
  const [reportSent, setReportSent] = useState(false);

  const filteredPosts = useMemo(() => posts.filter(post => !blocked.includes(post.authorId)), [blocked, posts]);
  const filteredChat = useMemo(() => chat.filter(message => !blocked.includes(message.authorId)), [blocked, chat]);
  const blockedUsers = blocked.map(userId => ({
    id: userId,
    name: posts.find(post => post.authorId === userId)?.author ?? chat.find(message => message.authorId === userId)?.author ?? "Unknown user",
  }));
  const bg = isDark ? "bg-[#0b1220]" : "bg-[#f6f8fb]";
  const card = isDark ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-white";
  const text = isDark ? "text-slate-100" : "text-slate-900";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const border = isDark ? "border-slate-800" : "border-slate-200";
  const input = isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400";

  const initials = currentUserName.split(/[ ._-]+/).map(part => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const toggleLike = (postId: string) => {
    setPosts(current => current.map(post => post.id === postId ? { ...post, liked: !post.liked, reactions: post.reactions + (post.liked ? -1 : 1) } : post));
  };

  const toggleBlock = (userId: string) => {
    setBlocked(current => current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]);
  };

  const publishPost = () => {
    const text = postDraft.trim();
    if (!text) return;
    setPosts(current => [{ id: `post-${Date.now()}`, authorId: currentUserId, author: currentUserName, initials, tone: "from-emerald-400 to-teal-500", time: "just now", text, reactions: 0, comments: 0, liked: false }, ...current]);
    setPostDraft("");
  };

  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;
    setChat(current => [...current, { id: `chat-${Date.now()}`, authorId: currentUserId, author: currentUserName, initials, text, time: "now" }]);
    setChatDraft("");
  };

  const submitReport = () => {
    setReportSent(true);
    setTimeout(() => { setReportTarget(null); setReportSent(false); }, 1200);
  };

  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors duration-300`} style={{ fontFamily: "Outfit, sans-serif" }}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isDark ? "border-slate-800 bg-[#0b1220]/90" : "border-slate-200 bg-white/90"}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <button type="button" onClick={onBack} className={`flex items-center gap-2 text-sm font-semibold ${muted} transition hover:${text}`} aria-label="Back to dashboard">
            <span className="text-lg">←</span><span className="hidden sm:inline">ClearanceFlow</span>
          </button>
          <div className="h-5 w-px bg-slate-700/60" />
          <div className="mr-auto"><p className="text-sm font-bold">Freespace</p><p className={`text-[11px] ${muted}`}>Campus life, minus the formalities</p></div>
          <nav className={`flex items-center gap-1 rounded-lg p-1 ${isDark ? "bg-slate-900" : "bg-slate-100"}`} aria-label="Freespace views">
            <button type="button" onClick={() => setActiveView("feed")} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${activeView === "feed" ? "bg-emerald-500 text-white" : muted}`}>Feed</button>
            <button type="button" onClick={() => setActiveView("directory")} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${activeView === "directory" ? "bg-emerald-500 text-white" : muted}`}>People</button>
          </nav>
          <button type="button" onClick={toggle} className={`flex h-8 w-8 items-center justify-center rounded-full ${isDark ? "bg-slate-800 text-amber-300" : "bg-slate-100 text-slate-600"}`} title="Switch theme">{isDark ? "☀" : "◐"}</button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">{initials}</div>
        </div>
      </header>

      {activeView === "directory" ? (
        <main className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
          <StudentDirectory
            embedded
            onBack={() => setActiveView("feed")}
            onViewProfile={onViewProfile ?? (() => undefined)}
            currentUserId={currentUserId}
          />
        </main>
      ) : <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] sm:px-6">
        <section className="min-w-0 space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-300/30 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-950/10">
            <div className="relative z-10 max-w-xl"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Pinned by Student Affairs</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{announcement.title}</h1><p className="mt-2 max-w-lg text-sm leading-6 text-emerald-50">{announcement.body}</p><p className="mt-4 text-xs text-emerald-100">{announcement.meta}</p></div>
            <div className="absolute -right-4 -top-10 text-[11rem] font-black leading-none text-white/10">!</div>
          </div>

          <div className={`rounded-2xl border p-4 ${card}`}>
            <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">{initials}</div><textarea value={postDraft} onChange={event => setPostDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); publishPost(); } }} placeholder="Share a thought, a win, or a campus find..." rows={2} className={`min-h-18 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-emerald-400 ${input}`} /></div>
            <div className={`mt-3 flex items-center justify-between border-t pt-3 ${border}`}><span className={`text-xs ${muted}`}>Keep it kind. This is a shared space.</span><button type="button" onClick={publishPost} className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-400">Post</button></div>
          </div>

          {filteredPosts.map(post => (
            <article key={post.id} className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-start gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${post.tone} text-xs font-bold text-white`}>{post.initials}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-sm font-bold">{post.author}</h2><span className={`text-xs ${muted}`}>· {post.time}</span></div><p className={`mt-3 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{post.text}</p></div><div className="relative"><details className="group"><summary className={`cursor-pointer list-none px-2 text-lg leading-none ${muted}`}>•••</summary><div className={`absolute right-0 top-7 z-10 w-36 rounded-xl border p-1 shadow-xl ${card}`}><button type="button" onClick={() => toggleBlock(post.authorId)} className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${muted} hover:bg-slate-800 hover:text-white`}>{blocked.includes(post.authorId) ? "Unblock user" : "Block user"}</button><button type="button" onClick={() => setReportTarget({ id: post.id, name: post.author })} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10">Report post</button></div></details></div></div>
              <div className={`mt-4 flex items-center gap-5 border-t pt-3 ${border}`}><button type="button" onClick={() => toggleLike(post.id)} className={`text-xs font-semibold ${post.liked ? "text-rose-400" : muted}`}>{post.liked ? "♥ Liked" : "♡ Like"} <span className="ml-1 font-normal">{post.reactions}</span></button><button type="button" className={`text-xs font-semibold ${muted}`}>◯ Comment <span className="ml-1 font-normal">{post.comments}</span></button><button type="button" onClick={() => setReportTarget({ id: post.id, name: post.author })} className={`ml-auto text-xs ${muted} hover:text-rose-400`}>Report</button></div>
            </article>
          ))}
          {filteredPosts.length === 0 && <div className={`rounded-2xl border p-8 text-center text-sm ${card} ${muted}`}>Your feed is quiet because every hidden account is blocked.</div>}
        </section>

        <aside className="space-y-5">
          <section className={`rounded-2xl border p-5 ${card}`}><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold">World chat</h2><p className={`mt-1 text-xs ${muted}`}>Everyone in ClearanceFlow</p></div><span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" />Live</span></div><div className="custom-scroll max-h-72 space-y-4 overflow-y-auto pr-1">{filteredChat.map(message => <div key={message.id} className="flex gap-2.5"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-200">{message.initials}</div><div className="min-w-0"><div className="flex items-baseline gap-2"><span className="text-xs font-bold">{message.author}</span><span className={`text-[10px] ${muted}`}>{message.time}</span></div><p className={`mt-0.5 text-xs leading-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{message.text}</p></div></div>)}</div><div className={`mt-4 flex gap-2 border-t pt-4 ${border}`}><input value={chatDraft} onChange={event => setChatDraft(event.target.value)} onKeyDown={event => event.key === "Enter" && sendChat()} placeholder="Say something..." className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus:border-emerald-400 ${input}`} /><button type="button" onClick={sendChat} className="rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-400" aria-label="Send chat message">↑</button></div></section>
          <section className={`rounded-2xl border p-5 ${card}`}><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Your space</h2><p className={`mt-1 text-xs ${muted}`}>A few good boundaries</p></div><span className="text-xl">✦</span></div><div className={`mt-4 space-y-3 border-t pt-4 text-xs ${border}`}><div className="flex items-center justify-between"><span className={muted}>Blocked users</span><span className="font-bold">{blocked.length}</span></div>{blockedUsers.length > 0 && <div className="space-y-2">{blockedUsers.map(user => <div key={user.id} className="flex items-center justify-between gap-3"><span className="truncate font-semibold">{user.name}</span><button type="button" onClick={() => toggleBlock(user.id)} className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10">Unblock</button></div>)}</div>}<p className={muted}>Blocked accounts disappear from your feed and world chat.</p></div></section>
        </aside>
      </main>}

      {reportTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true"><div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${card}`}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-400">Safety report</p><h2 className="mt-1 text-lg font-bold">Report {reportTarget.name}</h2></div><button type="button" onClick={() => setReportTarget(null)} className={`text-xl ${muted}`} aria-label="Close report dialog">×</button></div>{reportSent ? <p className="py-8 text-sm text-emerald-400">Thanks. Your report was sent to Student Affairs.</p> : <><label className={`mt-5 block text-xs font-semibold ${muted}`} htmlFor="report-reason">Why are you reporting this?</label><select id="report-reason" value={reportReason} onChange={event => setReportReason(event.target.value)} className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${input}`}><option>Spam or misleading content</option><option>Harassment or bullying</option><option>Hate speech</option><option>Something else</option></select><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setReportTarget(null)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${muted}`}>Cancel</button><button type="button" onClick={submitReport} className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400">Send report</button></div></>}</div></div>}
    </div>
  );
}