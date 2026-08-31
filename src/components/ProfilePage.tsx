"use client";
import { useState, useRef } from 'react';
import { DeptKey, DEPT_CONFIG } from '../types';
import { useTheme } from '../context/ThemeContext';

export interface ProfileData {
  id: string;
  name: string;
  role: 'student' | 'faculty' | 'superadmin';
  dept: DeptKey;
  studentNumber?: string;
  email?: string;
  yearLevel?: number;
  section?: string;
  position?: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  highlights: { id: string; url: string; caption: string }[];
  joinedAt: string;
}

interface Props {
  profile: ProfileData;
  isOwner: boolean;
  onBack: () => void;
  onBrowse: () => void;
}

const SAMPLE_COVER =
  'https://images.unsplash.com/photo-1727560783405-aca445d74d4c?w=1200&h=340&fit=crop&auto=format';

const DEFAULT_HIGHLIGHTS = [
  {
    id: 'h1',
    url: 'https://images.unsplash.com/photo-1539413595691-37a09a48579b?w=400&h=400&fit=crop&auto=format',
    caption: 'Graduation Day 🎓',
  },
  {
    id: 'h2',
    url: 'https://images.unsplash.com/photo-1560439514-e960a3ef5019?w=400&h=400&fit=crop&auto=format',
    caption: 'Tech Summit 2024',
  },
  {
    id: 'h3',
    url: 'https://images.unsplash.com/photo-1563807894768-f28bee0d37b6?w=400&h=400&fit=crop&auto=format',
    caption: 'Best Project Award',
  },
  {
    id: 'h4',
    url: 'https://images.unsplash.com/photo-1613902964117-bef5d15f1c94?w=400&h=400&fit=crop&auto=format',
    caption: 'Campus Life',
  },
];

type Tab = 'about' | 'highlights' | 'clearance';

export default function ProfilePage({ profile: initialProfile, isOwner, onBack, onBrowse }: Props) {
  const { isDark, toggle } = useTheme();
  const [profile, setProfile] = useState<ProfileData>({
    ...initialProfile,
    coverUrl: initialProfile.coverUrl ?? SAMPLE_COVER,
    highlights: initialProfile.highlights.length ? initialProfile.highlights : DEFAULT_HIGHLIGHTS,
  });
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('about');
  const [draftBio, setDraftBio] = useState(profile.bio);
  const [draftName, setDraftName] = useState(profile.name);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLInputElement>(null);

  const cfg = DEPT_CONFIG[profile.dept];

  const bg = isDark ? 'bg-slate-950' : 'bg-gray-50';
  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const muted = isDark ? 'text-slate-500' : 'text-slate-500';
  const input = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500'
    : 'bg-white border-gray-300 text-slate-900 placeholder-slate-400 focus:border-blue-400';
  const navBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-gray-200';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfile(p => ({ ...p, avatarUrl: URL.createObjectURL(file) }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfile(p => ({ ...p, coverUrl: URL.createObjectURL(file) }));
  };

  const handleHighlightAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile(p => ({
      ...p,
      highlights: [...p.highlights, { id: `h_${Date.now()}`, url, caption: file.name.replace(/\.[^.]+$/, '') }],
    }));
  };

  const removeHighlight = (id: string) =>
    setProfile(p => ({ ...p, highlights: p.highlights.filter(h => h.id !== id) }));

  const saveEdits = () => {
    setProfile(p => ({ ...p, bio: draftBio, name: draftName }));
    setEditing(false);
  };

  const cancelEdits = () => {
    setDraftBio(profile.bio);
    setDraftName(profile.name);
    setEditing(false);
  };

  const initials = profile.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const roleLabel = profile.role === 'student' ? 'Student' : profile.role === 'faculty' ? 'Faculty' : 'Administrator';

  return (
    <div
      className={`min-h-screen ${bg} ${text} transition-colors duration-300`}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Nav bar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${navBg}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className={`${muted} hover:${text} transition-colors`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white"
              style={{ background: cfg.color }}
            >
              CF
            </div>
            <span className={`text-sm font-bold ${text}`}>ClearanceFlow</span>
          </div>

          <button
            onClick={onBrowse}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              isDark
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-500 hover:bg-gray-100'
            }`}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            Browse Students
          </button>

          <button
            onClick={toggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-yellow-300'
                : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto pb-16">
        {/* Cover photo */}
        <div className="relative h-48 sm:h-64 rounded-b-2xl overflow-hidden bg-slate-800 group">
          {profile.coverUrl && <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          {isOwner && editing && (
            <button
              onClick={() => coverRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold gap-2"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Change Cover
            </button>
          )}
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        {/* Profile header */}
        <div className={`mx-4 -mt-16 relative z-10 rounded-2xl border p-6 ${card}`}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-700"
                style={{ outline: `4px solid ${isDark ? '#0f172a' : '#fff'}` }}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${cfg.color}88, ${cfg.color})` }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              {isOwner && editing && (
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-400 transition-colors shadow-lg"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  className={`text-xl font-bold rounded-lg px-2 py-1 border w-full mb-1 outline-none ${input}`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                />
              ) : (
                <h1 className={`text-xl font-bold ${text}`}>{profile.name}</h1>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  {cfg.abbr}
                </span>
                <span className={`text-xs ${muted}`}>{roleLabel}</span>
                {profile.studentNumber && (
                  <span className={`text-xs font-mono ${muted}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.studentNumber}
                  </span>
                )}
                {profile.yearLevel && <span className={`text-xs ${muted}`}>{profile.yearLevel}th Year · {profile.section}</span>}
                {profile.position && <span className={`text-xs ${muted}`}>{profile.position}</span>}
              </div>
              <div className={`text-xs mt-1 ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                Member since {profile.joinedAt}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              {isOwner ? (
                editing ? (
                  <>
                    <button
                      onClick={saveEdits}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-400 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdits}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                      }`}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    ✏️ Edit Profile
                  </button>
                )
              ) : (
                <button
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: cfg.color }}
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1 mt-5 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            {(['about', 'highlights', 'clearance'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  tab === t ? 'text-white' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
                style={tab === t ? { background: cfg.color } : {}}
              >
                {t === 'about' ? '👤 About' : t === 'highlights' ? '📸 Highlights' : '📋 Clearance'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-4 mx-4 space-y-4">
          {tab === 'about' && (
            <AboutTab
              profile={profile}
              editing={editing}
              draftBio={draftBio}
              onBioChange={setDraftBio}
              isDark={isDark}
              card={card}
              text={text}
              muted={muted}
              input={input}
              cfg={cfg}
            />
          )}

          {tab === 'highlights' && (
            <HighlightsTab
              highlights={profile.highlights}
              editing={editing && isOwner}
              onAdd={() => highlightRef.current?.click()}
              onRemove={removeHighlight}
              isDark={isDark}
              card={card}
              text={text}
              muted={muted}
            />
          )}

          {tab === 'clearance' && (
            <ClearanceTab isDark={isDark} card={card} text={text} muted={muted} cfg={cfg} role={profile.role} />
          )}
        </div>
      </div>

      <input ref={highlightRef} type="file" accept="image/*" className="hidden" onChange={handleHighlightAdd} />
    </div>
  );
}

// ─── About Tab ──────────────────────────────────────────────────────────────

function AboutTab({
  profile,
  editing,
  draftBio,
  onBioChange,
  isDark,
  card,
  text,
  muted,
  input,
  cfg,
}: {
  profile: ProfileData;
  editing: boolean;
  draftBio: string;
  onBioChange: (v: string) => void;
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
  input: string;
  cfg: typeof DEPT_CONFIG[DeptKey];
}) {
  return (
    <>
      {/* Bio */}
      <div className={`rounded-2xl border p-5 ${card}`}>
        <h3 className={`text-sm font-bold mb-3 ${text}`}>Bio</h3>
        {editing ? (
          <textarea
            value={draftBio}
            onChange={e => onBioChange(e.target.value)}
            rows={4}
            placeholder="Tell others about yourself..."
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none transition-all ${input}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        ) : (
          <p className={`text-sm leading-relaxed ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
            {profile.bio || 'No bio yet.'}
          </p>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-3 ${text}`}>Academic Info</h3>
          <div className="space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            {[
              { label: 'School', value: 'Saint John Bosco College of Northern Luzon, Inc.' },
              { label: 'Department', value: cfg.label },
              { label: 'Program', value: profile.section?.split('-')[0] ?? '—' },
              {
                label: 'Year Level',
                value: profile.yearLevel ? `${profile.yearLevel}${['st', 'nd', 'rd', 'th'][Math.min(profile.yearLevel - 1, 3)]} Year` : '—',
              },
              { label: 'Section', value: profile.section ?? '—' },
              { label: 'Student No.', value: profile.studentNumber ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex gap-3">
                <span className={`text-xs w-24 shrink-0 ${muted}`}>{row.label}</span>
                <span className={`text-xs font-medium ${text} flex-1`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-3 ${text}`}>Achievements</h3>
          <div className="space-y-2">
            {[
              { icon: '🏆', label: "Dean's List", sub: 'AY 2023–2024, 1st Sem' },
              { icon: '🥇', label: 'Best Capstone', sub: 'Dept. Level, 2024' },
              { icon: '🎖️', label: 'Student Leader', sub: 'JPCS Chapter President' },
              { icon: '📜', label: 'Academic Scholar', sub: 'Full Scholarship, 2022–now' },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <span className="text-base">{a.icon}</span>
                <div>
                  <div className={`text-xs font-semibold ${text}`}>{a.label}</div>
                  <div className={`text-xs ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                    {a.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Highlights Tab ─────────────────────────────────────────────────────────

function HighlightsTab({
  highlights,
  editing,
  onAdd,
  onRemove,
  isDark,
  card,
  text,
  muted,
}: {
  highlights: ProfileData['highlights'];
  editing: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className={`rounded-2xl border p-5 ${card}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold ${text}`}>Highlights</h3>
        {editing && (
          <button
            onClick={onAdd}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 border border-blue-900/50 bg-blue-950/30 hover:bg-blue-950/60 transition-all"
          >
            + Add Photo
          </button>
        )}
      </div>

      {highlights.length === 0 && (
        <p className={`text-sm text-center py-8 ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
          No highlights yet.{editing && ' Click "Add Photo" to get started.'}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {highlights.map(h => (
          <div
            key={h.id}
            className="relative group rounded-xl overflow-hidden aspect-square bg-slate-800 cursor-pointer"
            onClick={() => setExpanded(expanded === h.id ? null : h.id)}
          >
            <img src={h.url} alt={h.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-white text-xs font-medium truncate">{h.caption}</span>
            </div>
            {editing && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemove(h.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {expanded && (() => {
        const photo = highlights.find(h => h.id === expanded);
        if (!photo) return null;
        return (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setExpanded(null)}
          >
            <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <img src={photo.url} alt={photo.caption} className="w-full rounded-2xl object-cover max-h-[70vh]" />
              <p className="text-white text-sm font-medium mt-3 text-center">{photo.caption}</p>
              <button onClick={() => setExpanded(null)} className="absolute top-4 right-4 text-white text-2xl font-bold">
                ×
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Clearance Tab ──────────────────────────────────────────────────────────

function ClearanceTab({
  isDark,
  card,
  text,
  muted,
  cfg,
  role,
}: {
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
  cfg: typeof DEPT_CONFIG[DeptKey];
  role: ProfileData['role'];
}) {
  const steps = [
    { label: 'Library', status: 'done', date: 'Aug 18, 2025' },
    { label: 'Medical', status: 'done', date: 'Aug 19, 2025' },
    { label: 'Finance', status: 'active', date: 'Pending' },
    { label: 'SAS', status: 'active', date: 'Pending' },
    { label: 'Dept Head', status: 'locked', date: '—' },
    { label: 'Registrar', status: 'locked', date: '—' },
  ];

  const done = steps.filter(s => s.status === 'done').length;

  return (
    <div className={`rounded-2xl border p-5 ${card}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold ${text}`}>
          {role === 'student' ? 'Clearance Progress' : 'Department Clearance Stats'}
        </h3>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ background: `${cfg.color}20`, color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}
        >
          {done}/{steps.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className={`h-2 rounded-full mb-5 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(done / steps.length) * 100}%`, background: cfg.color }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-gray-50'}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                s.status === 'done'
                  ? 'bg-emerald-500 text-white'
                  : s.status === 'active'
                  ? 'text-white'
                  : `${isDark ? 'bg-slate-700 text-slate-500' : 'bg-gray-200 text-gray-400'}`
              }`}
              style={s.status === 'active' ? { background: cfg.color } : {}}
            >
              {s.status === 'done' ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs font-medium flex-1 ${s.status === 'locked' ? muted : text}`}
            >
              {s.label}
            </span>
            <span
              className={`text-xs font-mono ${s.status === 'done' ? 'text-emerald-400' : muted}`}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {s.date}
            </span>
            {s.status === 'locked' && <span className="text-xs">🔒</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
