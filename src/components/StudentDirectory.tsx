"use client";
import { useState } from 'react';
import { DeptKey, DEPT_CONFIG } from '../types';
import type { ProfileData } from './ProfilePage';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onBack: () => void;
  onViewProfile: (profile: ProfileData) => void;
  currentUserId: string;
  embedded?: boolean;
}

const DIRECTORY: ProfileData[] = [
  {
    id: 'u1',
    name: 'Maria Santos',
    role: 'student',
    dept: 'cs',
    studentNumber: '2024-10042',
    yearLevel: 3,
    section: 'BSCS-3A',
    bio: "Coffee-fueled coder and aspiring software engineer. Loves UI/UX and building things that matter. Dean's Lister, AY 2023-2024.",
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'August 2024',
  },
  {
    id: 'u2',
    name: 'Carlos Reyes',
    role: 'student',
    dept: 'hm',
    studentNumber: '2023-08810',
    yearLevel: 4,
    section: 'BSHM-4B',
    bio: 'Passionate about the hospitality industry and event management. Future hotel director. Part-time barista.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'June 2023',
  },
  {
    id: 'u3',
    name: 'Anika Bautista',
    role: 'student',
    dept: 'cs',
    studentNumber: '2024-10101',
    yearLevel: 3,
    section: 'BSCS-3B',
    bio: 'Full-stack developer in training. Open-source contributor and hackathon enthusiast.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'August 2024',
  },
  {
    id: 'u4',
    name: 'Jose Miguel Flores',
    role: 'student',
    dept: 'crim',
    studentNumber: '2023-07714',
    yearLevel: 4,
    section: 'BSCRIM-4A',
    bio: "Aspiring criminologist and public safety advocate. Thesis: 'Digital Forensics in Local Law Enforcement'.",
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'June 2023',
  },
  {
    id: 'u5',
    name: 'Patricia Lim',
    role: 'student',
    dept: 'basiced',
    studentNumber: '2024-10350',
    yearLevel: 2,
    section: 'BEED-2A',
    bio: 'Future educator with a passion for early childhood development and innovative teaching methods.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'August 2024',
  },
  {
    id: 'u6',
    name: 'Roberto Cruz',
    role: 'student',
    dept: 'tesda',
    studentNumber: '2023-09001',
    yearLevel: 2,
    section: 'TVEC-2A',
    bio: 'Technical-vocational learner specializing in electrical installation and maintenance.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'June 2023',
  },
  {
    id: 'u7',
    name: 'Angelica Mendoza',
    role: 'student',
    dept: 'hm',
    studentNumber: '2024-10210',
    yearLevel: 2,
    section: 'BSHM-2A',
    bio: "Tourism and travel enthusiast. Food blogger and budding pastry chef. 'The world is a book.'",
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'August 2024',
  },
  {
    id: 'u8',
    name: 'Michael Aquino',
    role: 'student',
    dept: 'cs',
    studentNumber: '2022-06120',
    yearLevel: 4,
    section: 'BSCS-4A',
    bio: 'Cybersecurity track. CTF competitor and Linux enthusiast. Writing capstone on network intrusion detection.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'August 2022',
  },
  {
    id: 'u9',
    name: 'Christine Dela Peña',
    role: 'student',
    dept: 'crim',
    studentNumber: '2024-10430',
    yearLevel: 1,
    section: 'BSCRIM-1B',
    bio: 'First-year criminology student with an interest in forensic science and criminal psychology.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'August 2024',
  },
  {
    id: 'u10',
    name: 'Jerome Soriano',
    role: 'student',
    dept: 'basiced',
    studentNumber: '2023-08450',
    yearLevel: 3,
    section: 'BSED-3A',
    bio: 'Secondary education major in Filipino. Org leader and campus journalist. Likes basketball on weekends.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'June 2023',
  },
  {
    id: 'u11',
    name: 'Dr. Juana Dela Cruz',
    role: 'faculty',
    dept: 'cs',
    position: 'Department Chair, Computer Science',
    bio: 'Ph.D. in Computer Science (UP Diliman). Research areas: algorithm design and educational technology.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'January 2018',
  },
  {
    id: 'u12',
    name: 'Prof. Ramon Gonzales',
    role: 'faculty',
    dept: 'hm',
    position: 'Faculty, Hospitality Management',
    bio: 'Culinary Arts graduate with 15 years of hotel management experience. Certified tourism specialist.',
    avatarUrl: null,
    coverUrl: null,
    highlights: [],
    joinedAt: 'June 2015',
  },
];

type FilterDept = 'all' | DeptKey | 'faculty';

export default function StudentDirectory({ onBack, onViewProfile, currentUserId, embedded = false }: Props) {
  const { isDark, toggle } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterDept>('all');

  const bg = isDark ? 'bg-slate-950' : 'bg-gray-50';
  const nav = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-gray-200';
  const card = isDark
    ? 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
    : 'bg-white border-gray-200 hover:bg-gray-50';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const muted = isDark ? 'text-slate-500' : 'text-slate-500';
  const inputCls = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400';

  const filtered = DIRECTORY.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.studentNumber ?? '').includes(search) ||
      u.bio.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'
        ? true
        : filter === 'faculty'
        ? u.role === 'faculty'
        : u.dept === filter;
    return matchSearch && matchFilter;
  });

  const filters: { key: FilterDept; label: string; color?: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'faculty', label: 'Faculty', color: '#7C3AED' },
    ...Object.entries(DEPT_CONFIG).map(([k, v]) => ({
      key: k as DeptKey,
      label: v.abbr,
      color: v.color,
    })),
  ];

  return (
    <div
      className={`${embedded ? '' : 'min-h-screen'} ${bg} transition-colors duration-300`}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Nav */}
      {!embedded && <header className={`sticky top-0 z-20 border-b backdrop-blur-md ${nav}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className={`${muted} hover:${text} transition-colors`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={`text-sm font-bold ${text} flex-1`}>Student Directory</div>
          <span className={`text-xs ${muted}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {filtered.length} result{filtered.length !== 1 && 's'}
          </span>
          <button
            onClick={toggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
              isDark ? 'bg-slate-800 text-yellow-300' : 'bg-gray-100 text-slate-600'
            }`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>}

      <div className={`${embedded ? '' : 'max-w-5xl mx-auto'} px-4 py-6`}>
        {/* Search */}
        <div className="relative mb-4">
          <svg
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, student number, or bio…"
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        {/* Dept filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 border"
              style={
                filter === f.key
                  ? {
                      background: f.color ?? '#64748b',
                      color: '#fff',
                      borderColor: 'transparent',
                    }
                  : {
                      background: 'transparent',
                      color: isDark ? '#64748b' : '#94a3b8',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className={`text-center py-16 ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
            No students found for &quot;{search}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(u => (
              <DirectoryCard
                key={u.id}
                profile={u}
                isCurrentUser={u.id === currentUserId}
                card={card}
                text={text}
                muted={muted}
                isDark={isDark}
                onClick={() => onViewProfile(u)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DirectoryCard({
  profile,
  isCurrentUser,
  card,
  text,
  muted,
  isDark,
  onClick,
}: {
  profile: ProfileData;
  isCurrentUser: boolean;
  card: string;
  text: string;
  muted: string;
  isDark: boolean;
  onClick: () => void;
}) {
  const cfg = DEPT_CONFIG[profile.dept];
  const initials = profile.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const roleLabel =
    profile.role === 'faculty'
      ? profile.position ?? 'Faculty'
      : `${profile.yearLevel}${['st', 'nd', 'rd', 'th'][Math.min((profile.yearLevel ?? 1) - 1, 3)]} Year · ${profile.section}`;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${card}`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-base font-black text-white"
              style={{ background: `linear-gradient(135deg, ${cfg.color}88, ${cfg.color})` }}
            >
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold truncate ${text}`}>{profile.name}</div>
          <div className={`text-xs mt-0.5 truncate ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
            {roleLabel}
          </div>
          {profile.studentNumber && (
            <div className={`text-xs mt-0.5 font-mono ${muted}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {profile.studentNumber}
            </div>
          )}
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0" style={{ background: `${cfg.color}20`, color: cfg.color }}>
          {cfg.abbr}
        </span>
      </div>

      {/* Bio */}
      <p className={`text-xs leading-relaxed line-clamp-2 ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
        {profile.bio || 'No bio yet.'}
      </p>

      {/* Footer */}
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}
      >
        <span className={`text-xs ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
          Joined {profile.joinedAt}
        </span>
        {isCurrentUser && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${cfg.color}20`, color: cfg.color }}
          >
            You
          </span>
        )}
      </div>
    </button>
  );
}
