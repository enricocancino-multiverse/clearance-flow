"use client";
import { useRef, useState } from 'react';
import { DeptKey, DEPT_CONFIG } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLiveDashboardState, INITIAL_GRAPH_NODES, INITIAL_GRAPH_EDGES, INITIAL_QUEUE } from '../lib/liveDashboardState';

interface Props {
  currentUserId: string;
  userName: string;
  studentNumber: string;
  yearLevel: number;
  section: string;
  dept: DeptKey;
  onViewProfile: () => void;
  onBrowse: () => void;
  onSignOut: () => void;
}

type NodeStatus = 'completed' | 'active' | 'locked';

interface ClearNode {
  id: string;
  label: string;
  office: string;
  status: NodeStatus;
  prerequisites: string[];
  x: number;
  y: number;
}

const NODES: ClearNode[] = [
  { id: 'library', label: 'Library', office: 'University Library', status: 'completed', prerequisites: [], x: 160, y: 70 },
  { id: 'medical', label: 'Medical', office: 'Health Services Unit', status: 'completed', prerequisites: [], x: 490, y: 70 },
  { id: 'finance', label: 'Finance', office: 'Accounting Office', status: 'active', prerequisites: ['library'], x: 80, y: 210 },
  { id: 'sas', label: 'SAS', office: 'Student Affairs Office', status: 'active', prerequisites: ['library'], x: 310, y: 210 },
  { id: 'depthead', label: 'Dept Head', office: 'Department Office', status: 'locked', prerequisites: ['finance', 'sas'], x: 195, y: 360 },
  { id: 'registrar', label: 'Registrar', office: 'Registrar\'s Office', status: 'locked', prerequisites: ['depthead', 'medical'], x: 370, y: 480 },
];

const EDGES: [string, string][] = [
  ['library', 'finance'],
  ['library', 'sas'],
  ['finance', 'depthead'],
  ['sas', 'depthead'],
  ['medical', 'registrar'],
  ['depthead', 'registrar'],
];

const QUEUE = [
  { id: 1, office: 'Accounting Office', date: 'Tue, Aug 26', time: '9:00 – 11:00 AM', slot: 3, total: 12 },
  { id: 2, office: 'Student Affairs Office', date: 'Tue, Aug 26', time: '1:00 – 3:00 PM', slot: 7, total: 20 },
];

export default function StudentDashboard({
  currentUserId,
  userName,
  studentNumber,
  yearLevel,
  section,
  dept,
  onViewProfile,
  onBrowse,
  onSignOut,
}: Props) {
  const { isDark, toggle } = useTheme();
  const { state } = useLiveDashboardState();
  const cfg = DEPT_CONFIG[dept];
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const graphNodes = (state.graphNodes.length ? state.graphNodes : INITIAL_GRAPH_NODES) as ClearNode[];
  const graphEdges = state.graphEdges.length ? state.graphEdges : INITIAL_GRAPH_EDGES;
  const queue = state.queue.length ? state.queue : INITIAL_QUEUE;
  const completed = graphNodes.filter(n => n.status === 'completed').length;
  const progress = Math.round((completed / graphNodes.length) * 100);

  const clampZoom = (value: number) => Math.min(1.8, Math.max(0.8, value));

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.12 : 0.12;
    setZoom(prev => clampZoom(prev + delta));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setPan({
      x: dragRef.current.originX + dx / zoom,
      y: dragRef.current.originY + dy / zoom,
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const bg = isDark ? 'bg-slate-950' : 'bg-gray-50';
  const navBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-gray-200';
  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const muted = isDark ? 'text-slate-500' : 'text-slate-500';

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`} style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Top bar */}
      <header className={`sticky top-0 z-20 border-b backdrop-blur-md ${navBg}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={onViewProfile}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 hover:ring-2 transition-all"
            style={{ background: `linear-gradient(135deg, ${cfg.color}99, ${cfg.color})` }}
          >
            {initials}
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={onViewProfile}
              className={`text-sm font-semibold leading-none hover:underline ${text}`}
            >
              {userName}
            </button>
            <div className={`text-xs mt-0.5 ${muted}`}>{studentNumber} · {yearLevel}th Year</div>
          </div>

          {/* Dept badge */}
          <span
            className="px-3 py-1 rounded-full text-xs font-bold shrink-0"
            style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}
          >
            {cfg.abbr}
          </span>

          {/* Progress */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className={`text-xs font-medium ${muted}`}>{completed}/{NODES.length} Steps</div>
            <div className={`w-36 h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: cfg.color }}
              />
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs font-bold" style={{ color: cfg.color }}>
              {progress}%
            </div>
            <div className={`text-xs ${muted}`}>Complete</div>
          </div>

          <button
            onClick={onBrowse}
            className={`hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100'
            }`}
            title="Browse Students"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="17" cy="7" r="3" />
              <circle cx="7" cy="17" r="3" />
              <circle cx="17" cy="17" r="3" />
              <circle cx="7" cy="7" r="3" />
            </svg>
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

          <button
            type="button"
            onClick={onSignOut}
            className={`hidden rounded-lg px-3 py-2 text-xs font-semibold transition sm:inline-flex ${
              isDark
                ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-300'
                : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* Main: DAG visualizer */}
        <div className={`rounded-2xl border overflow-hidden ${card} lg:max-w-230 lg:mr-2`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'} flex items-center justify-between`}>
            <div>
              <h2 className={`text-sm font-semibold ${text}`}>Clearance Dependency Graph</h2>
              <p className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                Kahn's Topological Sort — directed acyclic graph
              </p>
            </div>
            <div className="flex items-center gap-3">
              <LegendItem color="#10B981" label="Completed" />
              <LegendItem color={cfg.color} label="Active" glow />
              <LegendItem color="#475569" label="Locked" />
            </div>
          </div>

          <div className="relative p-4">
            <div
              className="relative h-90 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/30 select-none"
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ cursor: dragRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '50% 50%',
                  transition: dragRef.current ? 'none' : 'transform 0.12s ease-out',
                }}
              >
                <DAGVisualizer
                  nodes={graphNodes}
                  edges={graphEdges.map(edge => [edge.from, edge.to] as [string, string])}
                  accentColor={cfg.color}
                  hoveredNode={hoveredNode}
                  onHover={setHoveredNode}
                />
              </div>
            </div>

            {/* Tooltip for locked nodes */}
            {hoveredNode && (() => {
              const n = graphNodes.find(x => x.id === hoveredNode);
              if (!n || n.status !== 'locked') return null;
              const prereqLabels = (n.prerequisites ?? []).map(p => graphNodes.find(x => x.id === p)?.label).filter(Boolean);
              return (
                <div
                  className={`absolute top-4 right-4 rounded-xl p-3 border max-w-45 text-xs ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-gray-200'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <div className={`font-semibold mb-1 ${text}`}>🔒 Prerequisites Required</div>
                  {prereqLabels.map(l => (
                    <div key={l} className={muted}>
                      · {l}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Node info strip */}
          <div className="px-3 sm:px-6 pb-4 sm:pb-5 mt-auto">
            <div className="custom-scroll flex gap-2 overflow-x-auto pb-1">
              {graphNodes.map(n => (
                <NodeCard key={n.id} node={n} accentColor={cfg.color} isDark={isDark} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: queue */}
        <div className="flex flex-col gap-4">
          {/* Status summary */}
          <div className={`rounded-2xl border p-5 ${card}`}>
            <h3 className={`text-sm font-semibold ${text} mb-3`}>Clearance Status</h3>
            <div className="space-y-2">
              {graphNodes.map(n => (
                <div key={n.id} className="flex items-center gap-3">
                  <StatusDot status={n.status} color={cfg.color} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${text}`}>{n.label}</div>
                    <div className={`text-xs truncate ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                      {n.office}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      n.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400'
                        : n.status === 'active'
                        ? 'text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                    style={n.status === 'active' ? { background: `${cfg.color}22`, color: cfg.color } : {}}
                  >
                    {n.status === 'completed' ? '✓ Done' : n.status === 'active' ? 'Active' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule queue */}
          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${text}`}>Assigned Sign-Off Windows</h3>
              <span className={`text-xs font-mono ${muted}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {queue.length} upcoming
              </span>
            </div>
            <div className="space-y-3">
              {queue.map(q => (
                <div
                  key={q.id}
                  className="rounded-xl p-3 border transition-all"
                  style={{ background: `${cfg.color}0d`, borderColor: `${cfg.color}30` }}
                >
                  <div className={`text-xs font-bold ${text} mb-1`}>{q.office}</div>
                  <div className={`text-xs mb-2 ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                    {q.date} · {q.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(q.slot / q.total) * 100}%`,
                          background: cfg.color,
                        }}
                      />
                    </div>
                    <span className={`text-xs font-mono ${muted}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      #{q.slot}/{q.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action prompt */}
          <div className={`rounded-2xl border p-5 ${card}`}>
            <h3 className={`text-sm font-semibold ${text} mb-1`}>Next Action</h3>
            <p className={`text-xs mb-3 ${muted}`} style={{ fontFamily: 'Inter, sans-serif' }}>
              Visit <span className={`${text} font-medium`}>Finance Office</span> or{' '}
              <span className={`${text} font-medium`}>SAS</span> — both are currently eligible based on your
              completed prerequisites.
            </p>
            <button
              className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
              style={{ background: cfg.color, color: '#fff' }}
            >
              View Office Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DAG Visualizer ────────────────────────────────────────────────────────────

function DAGVisualizer({
  nodes,
  edges,
  accentColor,
  hoveredNode,
  onHover,
}: {
  nodes: ClearNode[];
  edges: [string, string][];
  accentColor: string;
  hoveredNode: string | null;
  onHover: (id: string | null) => void;
}) {
  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  const nodeColor = (status: NodeStatus) => {
    if (status === 'completed') return '#10B981';
    if (status === 'active') return accentColor;
    return '#334155';
  };

  const edgeColor = (from: string, to: string) => {
    const f = getNode(from);
    const t = getNode(to);
    if (f.status === 'completed' && t.status !== 'locked') return '#10B981';
    if (f.status === 'active' || t.status === 'active') return accentColor + '88';
    return '#1e293b';
  };

  return (
    <svg viewBox="0 0 580 560" className="w-full" style={{ maxHeight: '400px' }}>
      <defs>
        <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#10B981" />
        </marker>
        <marker id="arrow-accent" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={accentColor} />
        </marker>
        <marker id="arrow-muted" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#1e293b" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map(([from, to]) => {
        const f = getNode(from);
        const t = getNode(to);
        const color = edgeColor(from, to);
        const isGreen = f.status === 'completed' && t.status !== 'locked';
        const isAccent = !isGreen && (f.status === 'active' || t.status === 'active');
        const marker = isGreen ? 'url(#arrow-green)' : isAccent ? 'url(#arrow-accent)' : 'url(#arrow-muted)';

        const dx = t.x - f.x,
          dy = t.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const r = 28;
        const x1 = f.x + (dx / dist) * r;
        const y1 = f.y + (dy / dist) * r;
        const x2 = t.x - (dx / dist) * r;
        const y2 = t.y - (dy / dist) * r;

        return (
          <line
            key={`${from}-${to}`}
            className="graph-edge"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="1.5"
            markerEnd={marker}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const color = nodeColor(n.status);
        const isHovered = hoveredNode === n.id;
        const isActive = n.status === 'active';

        return (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            style={{ cursor: n.status === 'locked' ? 'help' : 'default' }}
            onMouseEnter={() => onHover(n.id)}
            onMouseLeave={() => onHover(null)}
          >
            {/* Glow ring for active nodes */}
            {isActive && <circle r="40" fill={color} fillOpacity="0.08" filter="url(#glow)" />}
            {/* Outer ring */}
            <circle className="graph-node graph-glow" r="28" fill="#0f172a" stroke={color} strokeWidth={isActive ? 2 : 1.5} strokeOpacity={isHovered ? 1 : 0.8} />
            {/* Inner fill */}
            <circle className="graph-node" r="22" fill={`${color}18`} stroke={color} strokeWidth="0.5" strokeOpacity="0.4" />

            {/* Icon */}
            {n.status === 'completed' && <text textAnchor="middle" dy="5" fontSize="14" fill={color}>✓</text>}
            {n.status === 'locked' && <text textAnchor="middle" dy="5" fontSize="13" fill={color}>🔒</text>}
            {n.status === 'active' && <circle r="5" fill={color} />}

            {/* Label */}
            <text
              textAnchor="middle"
              y="42"
              fontSize="10"
              fontFamily="Outfit, sans-serif"
              fontWeight="600"
              fill={color}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function NodeCard({ node, accentColor, isDark }: { node: ClearNode; accentColor: string; isDark: boolean }) {
  const color = node.status === 'completed' ? '#10B981' : node.status === 'active' ? accentColor : '#475569';
  return (
    <div
      className={`min-w-32.5 flex-1 rounded-xl px-3 py-2 text-center border transition-all ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}
      style={{
        background: `${color}10`,
        boxShadow: node.status === 'active' ? `0 0 0 1px ${color}33 inset` : undefined,
      }}
    >
      <div className="flex items-center justify-center gap-2 text-xs font-semibold truncate" style={{ color }}>
        <span className="text-[11px]" aria-hidden="true">{node.status === 'completed' ? '✓' : node.status === 'active' ? '⚡' : '🔒'}</span>
        <span className="truncate">{node.label}</span>
      </div>
    </div>
  );
}

function StatusDot({ status, color }: { status: NodeStatus; color: string }) {
  return (
    <div
      className="w-2 h-2 rounded-full shrink-0"
      style={{
        background: status === 'completed' ? '#10B981' : status === 'active' ? color : '#334155',
      }}
    />
  );
}

function LegendItem({ color, label, glow }: { color: string; label: string; glow?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{
          background: color,
          boxShadow: glow ? `0 0 6px ${color}` : 'none',
        }}
      />
      <span className="text-xs text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  );
}
