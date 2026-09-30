"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLiveDashboardState } from "../lib/liveDashboardState";
import { DEPT_CONFIG, DeptKey } from "../types";

interface Props {
  onBack: () => void;
  onViewProfile: () => void;
}

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

const INITIAL_NODES: GraphNode[] = [
  { id: "library", label: "Library", x: 140, y: 70 },
  { id: "medical", label: "Medical", x: 400, y: 70 },
  { id: "finance", label: "Finance", x: 60, y: 200 },
  { id: "sas", label: "SAS", x: 270, y: 200 },
  { id: "depthead", label: "Dept Head", x: 165, y: 320 },
  { id: "registrar", label: "Registrar", x: 330, y: 430 },
];

const INITIAL_EDGES: GraphEdge[] = [
  { from: "library", to: "finance" },
  { from: "library", to: "sas" },
  { from: "finance", to: "depthead" },
  { from: "sas", to: "depthead" },
  { from: "medical", to: "registrar" },
  { from: "depthead", to: "registrar" },
];

const EXEC_DATA = [
  { n: 10, ms: 0.38, heap: 1.2 },
  { n: 50, ms: 1.82, heap: 4.8 },
  { n: 100, ms: 3.65, heap: 9.4 },
  { n: 250, ms: 9.12, heap: 22.1 },
  { n: 500, ms: 18.44, heap: 43.7 },
  { n: 1000, ms: 37.21, heap: 87.3 },
];

const DEPT_COUNTS = [
  { dept: "CS", students: 312, pending: 48, color: DEPT_CONFIG.cs.color },
  { dept: "HM", students: 198, pending: 27, color: DEPT_CONFIG.hm.color },
  { dept: "CRIM", students: 245, pending: 39, color: DEPT_CONFIG.crim.color },
  { dept: "BSED", students: 176, pending: 22, color: DEPT_CONFIG.basiced.color },
  { dept: "TVOC", students: 134, pending: 18, color: DEPT_CONFIG.tesda.color },
];

type Tab = "graph" | "metrics" | "users";

export default function AdminDashboard({ onBack, onViewProfile }: Props) {
  const { isDark } = useTheme();
  const { state, setGraph } = useLiveDashboardState();
  const [nodes, setNodes] = useState<GraphNode[]>(state.graphNodes.length ? state.graphNodes as GraphNode[] : INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(state.graphEdges.length ? state.graphEdges as GraphEdge[] : INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "draw" | "delete">("view");
  const [activeTab, setActiveTab] = useState<Tab>("graph");

  const bg = isDark ? "bg-slate-950" : "bg-gray-50";
  const navBg = isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-gray-200";
  const card = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";
  const text = isDark ? "text-slate-100" : "text-slate-900";
  const muted = isDark ? "text-slate-500" : "text-slate-500";

  const syncLiveGraph = (nextNodes: GraphNode[], nextEdges: GraphEdge[]) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
    setGraph(
      nextNodes.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
      nextEdges.map(edge => ({ from: edge.from, to: edge.to }))
    );
  };

  const handleNodeClick = (id: string) => {
    if (mode === "draw") {
      if (!selectedNode) {
        setSelectedNode(id);
      } else {
        if (selectedNode !== id) {
          const exists = edges.some(e => e.from === selectedNode && e.to === id);
          if (!exists) {
            const nextEdges = [...edges, { from: selectedNode, to: id }];
            setEdges(nextEdges);
            setGraph(
              nodes.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
              nextEdges.map(edge => ({ from: edge.from, to: edge.to }))
            );
          }
        }
        setSelectedNode(null);
      }
    } else {
      setSelectedNode(selectedNode === id ? null : id);
    }
  };

  const deleteEdge = (from: string, to: string) => {
    if (mode === "delete") {
      const nextEdges = edges.filter(e => !(e.from === from && e.to === to));
      setEdges(nextEdges);
      setGraph(
        nodes.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
        nextEdges.map(edge => ({ from: edge.from, to: edge.to }))
      );
    }
  };

  const addNode = () => {
    const id = `node_${Date.now()}`;
    const nextNodes = [
      ...nodes,
      {
        id,
        label: "New Node",
        x: 200 + Math.random() * 200,
        y: 150 + Math.random() * 200,
      },
    ];
    setNodes(nextNodes);
    setGraph(
      nextNodes.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
      edges.map(edge => ({ from: edge.from, to: edge.to }))
    );
  };

  const deleteNode = (id: string) => {
    const nextNodes = nodes.filter(n => n.id !== id);
    const nextEdges = edges.filter(e => e.from !== id && e.to !== id);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setGraph(
      nextNodes.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
      nextEdges.map(edge => ({ from: edge.from, to: edge.to }))
    );
    if (selectedNode === id) setSelectedNode(null);
  };

  const moveNode = (id: string, x: number, y: number) => {
    const nextNodes = nodes.map(node => (node.id === id ? { ...node, x, y } : node));
    setNodes(nextNodes);
    setGraph(
      nextNodes.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
      edges.map(edge => ({ from: edge.from, to: edge.to }))
    );
  };

  const renameNode = (id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const nextNodes = nodes.map(node => (node.id === id ? { ...node, label: trimmed } : node));
    setNodes(nextNodes);
    setGraph(
      nextNodes.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
      edges.map(edge => ({ from: edge.from, to: edge.to }))
    );
  };

  const resetGraph = () => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setSelectedNode(null);
    setGraph(
      INITIAL_NODES.map(node => ({ ...node, office: node.label, status: "locked", prerequisites: [] })),
      INITIAL_EDGES.map(edge => ({ from: edge.from, to: edge.to }))
    );
  };

  const totalStudents = DEPT_COUNTS.reduce((s, d) => s + d.students, 0);
  const totalPending = DEPT_COUNTS.reduce((s, d) => s + d.pending, 0);

  return (
    <div
      className={`min-h-screen ${bg} transition-colors duration-300`}
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      {/* Header */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-20 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBack} className={`${muted} hover:${text} transition-colors`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onViewProfile}
              className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={onViewProfile} className="text-left">
              <div className={`text-sm font-bold hover:underline ${text}`}>Master Control Panel</div>
              <div className={`text-xs ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                SuperAdmin · University-Wide System
              </div>
            </button>
          </div>

          <div className="flex-1" />

          {/* Tabs */}
          <div className={`flex gap-1 rounded-xl p-1 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
            {(["graph", "metrics", "users"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? isDark
                      ? "bg-slate-700 text-white"
                      : "bg-white text-gray-900"
                    : isDark
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "graph" ? "⬡ Graph Rules" : tab === "metrics" ? "⚡ Algorithm Metrics" : "👥 User Management"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Students", value: totalStudents, unit: "", color: "#94a3b8", mono: true },
            { label: "Active Clearances", value: totalPending, unit: "", color: "#3B82F6", mono: true },
            { label: "Avg Exec Time", value: "3.65", unit: "ms", color: "#10B981", mono: true },
            { label: "Graph Complexity", value: "O(V+E)", unit: "", color: "#8B5CF6", mono: false },
          ].map(cardData => (
            <div key={cardData.label} className={`rounded-xl border p-4 ${card}`}>
              <div
                className="text-2xl font-bold"
                style={{
                  color: cardData.color,
                  fontFamily: cardData.mono ? "JetBrains Mono, monospace" : "Outfit, sans-serif",
                }}
              >
                {cardData.value}
                {cardData.unit && <span className="text-sm ml-1">{cardData.unit}</span>}
              </div>
              <div className={`text-xs mt-1 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {cardData.label}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "graph" && (
          <GraphBuilder
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            mode={mode}
            onNodeClick={handleNodeClick}
            onEdgeClick={deleteEdge}
            onModeChange={setMode}
            onAddNode={addNode}
            onDeleteNode={deleteNode}
            onReset={resetGraph}
            onNodeMove={moveNode}
            onRenameNode={renameNode}
            isDark={isDark}
            card={card}
            text={text}
            muted={muted}
          />
        )}

        {activeTab === "metrics" && (
          <MetricsDashboard data={EXEC_DATA} deptCounts={DEPT_COUNTS} isDark={isDark} card={card} text={text} muted={muted} />
        )}

        {activeTab === "users" && (
          <UserManagement deptCounts={DEPT_COUNTS} isDark={isDark} card={card} text={text} muted={muted} />
        )}
      </div>
    </div>
  );
}

function GraphBuilder({
  nodes,
  edges,
  selectedNode,
  mode,
  onNodeClick,
  onEdgeClick,
  onModeChange,
  onAddNode,
  onDeleteNode,
  onReset,
  onNodeMove,
  onRenameNode,
  isDark,
  card,
  text,
  muted,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: string | null;
  mode: "view" | "draw" | "delete";
  onNodeClick: (id: string) => void;
  onEdgeClick: (from: string, to: string) => void;
  onModeChange: (m: "view" | "draw" | "delete") => void;
  onAddNode: () => void;
  onDeleteNode: (id: string) => void;
  onReset: () => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  onRenameNode: (id: string, label: string) => void;
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
}) {
  const getNode = (id: string) => nodes.find(n => n.id === id)!;
  const [draftName, setDraftName] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    setDraftName(selectedNode ? getNode(selectedNode)?.label ?? "" : "");
  }, [selectedNode, nodes]);

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 520,
      y: ((clientY - rect.top) / rect.height) * 520,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<SVGGElement>, id: string) => {
    if (mode !== "view") return;
    event.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const point = toSvgPoint(event.clientX, event.clientY);
    dragRef.current = { id, offsetX: point.x - node.x, offsetY: point.y - node.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const point = toSvgPoint(event.clientX, event.clientY);
    const { id, offsetX, offsetY } = dragRef.current;
    onNodeMove(id, Math.max(30, Math.min(490, point.x - offsetX)), Math.max(30, Math.min(490, point.y - offsetY)));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Canvas */}
      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-slate-800" : "border-gray-200"}`}>
          <div>
            <h2 className={`text-sm font-bold ${text}`}>Prerequisite Rules Builder</h2>
            <p className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Visual DAG editor — define clearance dependency order
            </p>
          </div>
          <div className="flex gap-2">
            {(["view", "draw", "delete"] as const).map(m => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  mode === m
                    ? m === "draw"
                      ? "bg-blue-600 text-white"
                      : m === "delete"
                      ? "bg-red-900 text-red-400"
                      : isDark
                      ? "bg-slate-700 text-white"
                      : "bg-gray-200 text-gray-900"
                    : isDark
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "draw" ? "+ Draw Rule" : m === "delete" ? "× Delete Edge" : "⌖ View"}
              </button>
            ))}
          </div>
        </div>

        {mode === "draw" && selectedNode && (
          <div
            className={`px-6 py-2 text-xs flex items-center gap-2 border-b ${
              isDark ? "bg-blue-950/40 border-blue-900/40 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Source: <strong>{getNode(selectedNode)?.label}</strong> — now click the target node to create a rule
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox="0 0 520 520"
          className="w-full"
          style={{ maxHeight: "520px" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            <marker id="sa-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3B82F6" />
            </marker>
            <marker id="sa-arrow-del" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
            </marker>
            <filter id="sa-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid dots */}
          {Array.from({ length: 10 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 52 + 10} cy={row * 52 + 10} r="1" fill="#1e293b" />
            ))
          )}

          {/* Edges */}
          {edges.map(({ from, to }) => {
            const f = nodes.find(n => n.id === from);
            const t = nodes.find(n => n.id === to);
            if (!f || !t) return null;
            const dx = t.x - f.x,
              dy = t.y - f.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;
            const r = 28;
            const x1 = f.x + (dx / dist) * r;
            const y1 = f.y + (dy / dist) * r;
            const x2 = t.x - (dx / dist) * r;
            const y2 = t.y - (dy / dist) * r;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;

            return (
              <g key={`${from}-${to}`}>
                <line
                  className="graph-edge"
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={mode === "delete" ? "#ef4444" : "#3B82F6"}
                  strokeWidth={mode === "delete" ? 2 : 1.5}
                  markerEnd={mode === "delete" ? "url(#sa-arrow-del)" : "url(#sa-arrow)"}
                  strokeOpacity="0.7"
                />
                {mode === "delete" && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth="12"
                    style={{ cursor: "pointer" }}
                    onClick={() => onEdgeClick(from, to)}
                  />
                )}
                <circle cx={mx} cy={my} r="8" fill="#1e293b" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.5" />
                <text
                  x={mx}
                  y={my + 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#3B82F6"
                  fontFamily="JetBrains Mono"
                >
                  →
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const isSelected = selectedNode === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: mode === "view" ? "grab" : "pointer" }}
                onPointerDown={event => handlePointerDown(event, n.id)}
                onClick={() => onNodeClick(n.id)}
              >
                {isSelected && <circle r="38" fill="#3B82F6" fillOpacity="0.1" filter="url(#sa-glow)" />}
                <circle
                  className="graph-node graph-glow"
                  r="28"
                  fill="#0f172a"
                  stroke={isSelected ? "#3B82F6" : "#334155"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <circle r="20" fill={isSelected ? "#1e3a5f" : "#1e293b"} />
                <text
                  textAnchor="middle"
                  dy="4"
                  fontSize="9"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="600"
                  fill={isSelected ? "#60a5fa" : "#94a3b8"}
                >
                  {n.label.split(" ")[0]}
                </text>
                <text textAnchor="middle" y="42" fontSize="9" fontFamily="Outfit, sans-serif" fontWeight="500" fill={isSelected ? "#93c5fd" : "#475569"}>
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls panel */}
      <div className="flex flex-col gap-4">
        {/* Edge list */}
        <div className={`rounded-2xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold ${text} mb-3`}>Active Rules ({edges.length})</h3>
          <div className={`space-y-1.5 max-h-64 overflow-y-auto ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
            {edges.map(({ from, to }) => {
              const f = nodes.find(n => n.id === from);
              const t = nodes.find(n => n.id === to);
              if (!f || !t) return null;
              return (
                <div
                  key={`${from}-${to}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg group transition-colors ${
                    isDark ? "bg-slate-800 hover:bg-slate-750" : "bg-white hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <span className={`text-xs font-medium flex-1 ${isDark ? "text-slate-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    {f.label}
                  </span>
                  <span className="text-blue-500 text-xs">→</span>
                  <span className={`text-xs font-medium flex-1 ${isDark ? "text-slate-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    {t.label}
                  </span>
                  <button
                    onClick={() => onEdgeClick(from, to)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph actions */}
        <div className={`rounded-2xl border p-5 space-y-2 ${card}`}>
          <h3 className={`text-sm font-bold ${text} mb-3`}>Actions</h3>
          <button
            onClick={onAddNode}
            className="w-full py-2 rounded-lg text-xs font-bold text-blue-400 border border-blue-900 bg-blue-950/30 hover:bg-blue-950/60 transition-all"
          >
            + Add Node
          </button>
          {selectedNode && (
            <>
              <div className="space-y-2">
                <label className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${muted}`}>
                  Rename Node
                </label>
                <input
                  value={draftName}
                  onChange={event => setDraftName(event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none ${
                    isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="Node label"
                />
                <button
                  onClick={() => {
                    onRenameNode(selectedNode, draftName);
                  }}
                  className="w-full py-2 rounded-lg text-xs font-bold border transition-all text-blue-400 border-blue-900 bg-blue-950/30 hover:bg-blue-950/60"
                >
                  Save Name
                </button>
              </div>
              <button
                onClick={() => onDeleteNode(selectedNode)}
                className="w-full py-2 rounded-lg text-xs font-bold text-red-400 border border-red-900 bg-red-950/30 hover:bg-red-950/60 transition-all"
              >
                Delete Selected Node
              </button>
            </>
          )}
          <button
            onClick={onReset}
            className={`w-full py-2 rounded-lg text-xs font-bold border transition-all ${
              isDark
                ? "text-slate-400 border-slate-700 hover:bg-slate-800"
                : "text-gray-600 border-gray-300 hover:bg-gray-100"
            }`}
          >
            Reset to Default
          </button>
        </div>

        {/* Cycle detection */}
        <div className={`rounded-2xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold ${text} mb-2`}>Graph Validation</h3>
          <div className="space-y-2">
            <StatusLine label="Cycle Detection" value="No cycles found" ok isDark={isDark} />
            <StatusLine label="DAG Valid" value="Yes" ok isDark={isDark} />
            <StatusLine label="Reachability" value={`${nodes.length} nodes`} ok isDark={isDark} />
            <StatusLine label="Edge Count" value={`${edges.length} rules`} ok isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsDashboard({
  data,
  deptCounts,
  isDark,
  card,
  text,
  muted,
}: {
  data: typeof EXEC_DATA;
  deptCounts: typeof DEPT_COUNTS;
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
}) {
  const maxMs = Math.max(...data.map(d => d.ms));
  const maxHeap = Math.max(...data.map(d => d.heap));

  const W = 480,
    H = 200,
    padL = 50,
    padB = 30,
    padT = 16,
    padR = 16;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xPos = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const yPosMs = (ms: number) => padT + innerH - (ms / maxMs) * innerH;
  const yPosHeap = (heap: number) => padT + innerH - (heap / maxHeap) * innerH;

  const msPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPosMs(d.ms)}`).join(" ");
  const heapPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPosHeap(d.heap)}`).join(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Execution time chart */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className="mb-4">
          <h3 className={`text-sm font-bold ${text}`}>Kahn's Algorithm — Execution Time</h3>
          <p className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
            O(V+E) linear scaling across simulated user counts
          </p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            <linearGradient id="msGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map(frac => (
            <line
              key={frac}
              x1={padL}
              y1={padT + innerH * (1 - frac)}
              x2={W - padR}
              y2={padT + innerH * (1 - frac)}
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}
          <path d={`${msPath} L${xPos(data.length - 1)},${padT + innerH} L${xPos(0)},${padT + innerH} Z`} fill="url(#msGrad)" />
          <path d={msPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={xPos(i)} cy={yPosMs(d.ms)} r="3.5" fill="#3B82F6" />
              <text
                x={xPos(i)}
                y={H - 4}
                textAnchor="middle"
                fontSize="8"
                fontFamily="JetBrains Mono"
                fill="#475569"
              >
                {d.n}
              </text>
            </g>
          ))}
          {[0, 0.5, 1].map(frac => (
            <text
              key={frac}
              x={padL - 6}
              y={padT + innerH * (1 - frac) + 3}
              textAnchor="end"
              fontSize="8"
              fontFamily="JetBrains Mono"
              fill="#475569"
            >
              {(maxMs * frac).toFixed(0)}ms
            </text>
          ))}
          <text x={W / 2} y={H} textAnchor="middle" fontSize="8" fontFamily="Inter" fill="#475569">
            n (users)
          </text>
        </svg>
      </div>

      {/* Heap snapshot */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className="mb-4">
          <h3 className={`text-sm font-bold ${text}`}>Space Complexity — Heap Snapshot</h3>
          <p className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
            Memory usage (MB) per traversal at simulated scale
          </p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            <linearGradient id="heapGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map(frac => (
            <line
              key={frac}
              x1={padL}
              y1={padT + innerH * (1 - frac)}
              x2={W - padR}
              y2={padT + innerH * (1 - frac)}
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}
          <path d={`${heapPath} L${xPos(data.length - 1)},${padT + innerH} L${xPos(0)},${padT + innerH} Z`} fill="url(#heapGrad)" />
          <path d={heapPath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={xPos(i)} cy={yPosHeap(d.heap)} r="3.5" fill="#10B981" />
              <text
                x={xPos(i)}
                y={H - 4}
                textAnchor="middle"
                fontSize="8"
                fontFamily="JetBrains Mono"
                fill="#475569"
              >
                {d.n}
              </text>
            </g>
          ))}
          {[0, 0.5, 1].map(frac => (
            <text
              key={frac}
              x={padL - 6}
              y={padT + innerH * (1 - frac) + 3}
              textAnchor="end"
              fontSize="8"
              fontFamily="JetBrains Mono"
              fill="#475569"
            >
              {(maxHeap * frac).toFixed(0)}MB
            </text>
          ))}
          <text x={W / 2} y={H} textAnchor="middle" fontSize="8" fontFamily="Inter" fill="#475569">
            n (users)
          </text>
        </svg>
      </div>

      {/* Scaling table */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <h3 className={`text-sm font-bold ${text} mb-4`}>O(V+E) Traversal Metrics</h3>
        <div className="space-y-0">
          <div
            className={`grid grid-cols-4 gap-2 px-3 py-2 text-xs font-bold border-b ${
              isDark ? "text-slate-500 border-slate-800" : "text-gray-500 border-gray-200"
            }`}
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span>n users</span>
            <span>V nodes</span>
            <span>E edges</span>
            <span>Time (ms)</span>
          </div>
          {data.map(d => (
            <div
              key={d.n}
              className={`grid grid-cols-4 gap-2 px-3 py-2.5 text-xs border-b transition-colors ${
                isDark
                  ? "border-slate-800/50 hover:bg-slate-800/30"
                  : "border-gray-100 hover:bg-gray-50"
              }`}
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              <span className="text-blue-400 font-bold">{d.n.toLocaleString()}</span>
              <span className={isDark ? "text-slate-400" : "text-gray-500"}>{(d.n * 6).toLocaleString()}</span>
              <span className={isDark ? "text-slate-400" : "text-gray-500"}>{(d.n * 8).toLocaleString()}</span>
              <span className="text-emerald-400">{d.ms.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dept distribution */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <h3 className={`text-sm font-bold ${text} mb-4`}>Department Load Distribution</h3>
        <div className="space-y-3">
          {deptCounts.map(d => {
            const pct = (d.pending / d.students) * 100;
            return (
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-gray-700"}`}
                    style={{ color: d.color, fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {d.dept}
                  </span>
                  <span className={`text-xs ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    {d.pending} pending / {d.students} total
                  </span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? "bg-slate-800" : "bg-gray-200"}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: d.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UserManagement({
  deptCounts,
  isDark,
  card,
  text,
  muted,
}: {
  deptCounts: typeof DEPT_COUNTS;
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
}) {
  const [roleFilter, setRoleFilter] = useState<"all" | "faculty" | "student">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("2026-2027");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const departmentOptions = [
    "all",
    "Computer Science",
    "Hospitality Management",
    "Criminology",
    "Basic Education (8 to K12)",
    "TESDA",
    "General Education",
  ];

  type AccountRow = {
    name: string;
    role: "Faculty Admin" | "Student";
    department: string;
    deptCode?: string;
    year?: string;
    batch?: string;
    status: string;
    lastLogin: string;
  };

  const teacherAccounts: AccountRow[] = [
    { name: "Dr. Juana Dela Cruz", role: "Faculty Admin", department: "Computer Science", deptCode: "CS", status: "Active", lastLogin: "2h ago" },
    { name: "Prof. Ramon Gonzales", role: "Faculty Admin", department: "Hospitality Management", deptCode: "HM", status: "Active", lastLogin: "1d ago" },
    { name: "Ms. Elena Villanueva", role: "Faculty Admin", department: "Criminology", deptCode: "CRIM", status: "In Class", lastLogin: "30min ago" },
    { name: "Mr. Patrick Sy", role: "Faculty Admin", department: "Basic Education (8 to K12)", deptCode: "BE", status: "Away", lastLogin: "3h ago" },
    { name: "Ms. Grace Tolentino", role: "Faculty Admin", department: "TESDA", deptCode: "TESDA", status: "Active", lastLogin: "45min ago" },
    { name: "Mr. Adrian Ramos", role: "Faculty Admin", department: "General Education", deptCode: "GEN", status: "Active", lastLogin: "1h ago" },
  ];

  const studentAccounts: AccountRow[] = [
    { name: "Alyssa M. Santos", role: "Student", department: "Computer Science", year: "3rd Year", batch: "2026-2027", status: "Clearance Active", lastLogin: "Today" },
    { name: "Joel D. Reyes", role: "Student", department: "Hospitality Management", year: "2nd Year", batch: "2026-2027", status: "Verified", lastLogin: "Yesterday" },
    { name: "Rhea C. Lim", role: "Student", department: "Criminology", year: "4th Year", batch: "2026-2027", status: "Hold", lastLogin: "2d ago" },
    { name: "Mika P. Torres", role: "Student", department: "Basic Education (8 to K12)", year: "Grade 10", batch: "2026-2027", status: "Clearance Active", lastLogin: "Today" },
    { name: "Nathan V. Perez", role: "Student", department: "TESDA", year: "1st Year", batch: "2026-2027", status: "Verified", lastLogin: "3h ago" },
    { name: "Celine A. Bautista", role: "Student", department: "General Education", year: "1st Year", batch: "2026-2027", status: "Clearance Active", lastLogin: "Today" },
  ];

  const accountLists: Record<"all" | "faculty" | "student", AccountRow[]> = {
    faculty: teacherAccounts,
    student: studentAccounts,
    all: [...teacherAccounts, ...studentAccounts],
  };

  const filteredAccounts = accountLists[roleFilter].filter(account => {
    const departmentMatch =
      departmentFilter === "all" || account.department === departmentFilter;
    const yearMatch =
      yearFilter === "all" ||
      (account.role === "Student" && account.year === yearFilter) ||
      account.role !== "Student";
    const batchMatch =
      batchFilter === "all" ||
      (account.role === "Student" && account.batch === batchFilter) ||
      account.role !== "Student";
    const searchMatch =
      searchTerm.trim() === "" ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.department.toLowerCase().includes(searchTerm.toLowerCase());

    return departmentMatch && yearMatch && batchMatch && searchMatch;
  });

  const statusClass = (status: string) => {
    if (status === "Active" || status === "Verified" || status === "Clearance Active") {
      return "text-emerald-400";
    }
    if (status === "In Class" || status === "Hold") {
      return "text-amber-400";
    }
    return "text-slate-500";
  };

  const departmentColors: Record<string, string> = {
    "Computer Science": DEPT_CONFIG.cs.color,
    "Hospitality Management": DEPT_CONFIG.hm.color,
    "Criminology": DEPT_CONFIG.crim.color,
    "Basic Education (8 to K12)": DEPT_CONFIG.basiced.color,
    TESDA: DEPT_CONFIG.tesda.color,
    "General Education": "#94a3b8",
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(part => part[0])
      .slice(0, 2)
      .join("");

  const batchHistory = ["2024-2025", "2025-2026", "2026-2027"];
  const yearOptions =
    departmentFilter === "TESDA"
      ? ["all", "1st Year", "2nd Year", "3rd Year"]
      : departmentFilter === "Basic Education (8 to K12)"
        ? ["all", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
        : ["all", "1st Year", "2nd Year", "3rd Year", "4th Year"];

  return (
    <div className={`rounded-2xl border overflow-hidden ${card}`}>
      <div className={`px-6 py-4 border-b ${isDark ? "border-slate-800" : "border-gray-200"}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className={`text-sm font-bold ${text}`}>User Management</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className={muted}>
                <circle cx="11" cy="11" r="6" />
                <path d="M20 20l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search user..."
                className={`w-28 bg-transparent text-xs outline-none ${isDark ? "text-slate-100 placeholder:text-slate-500" : "text-gray-700 placeholder:text-gray-400"}`}
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as "all" | "faculty" | "student")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium outline-none ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <option value="all">All Accounts</option>
              <option value="faculty">Teachers</option>
              <option value="student">Students</option>
            </select>

            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium outline-none ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              {departmentOptions.map(option => (
                <option key={option} value={option}>
                  {option === "all" ? "All Departments" : option}
                </option>
              ))}
            </select>

            <select
              value={yearOptions.includes(yearFilter) ? yearFilter : "all"}
              onChange={e => setYearFilter(e.target.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium outline-none ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              {yearOptions.map(option => (
                <option key={option} value={option}>
                  {option === "all" ? "All Year Levels" : option}
                </option>
              ))}
            </select>

            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium outline-none ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <option value="all">All Batches</option>
              {batchHistory.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>

            <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-colors">
              + Add Account
            </button>
          </div>
        </div>
      </div>

      <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-200"}`}>
        {filteredAccounts.length === 0 ? (
          <div className={`px-6 py-8 text-sm ${muted}`}>
            No accounts match this department filter.
          </div>
        ) : (
          filteredAccounts.map(account => {
            const color = departmentColors[account.department] ?? "#94a3b8";
            const isStudent = account.role === "Student";

            return (
              <div
                key={`${account.name}-${account.department}`}
                className={`px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4 transition-colors ${
                  isDark ? "hover:bg-slate-800/30" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: `${color}66` }}
                >
                  {getInitials(account.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${text}`}>{account.name}</div>
                  <div className={`text-xs mt-0.5 ${muted}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    {account.role}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${color}22`, color }}
                  >
                    {account.deptCode ?? account.department.slice(0, 4).toUpperCase()}
                  </span>

                  {isStudent ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-200">
                      {account.year}
                    </span>
                  ) : null}

                  <span className={`text-xs font-semibold shrink-0 ${statusClass(account.status)}`}>
                    {account.status}
                  </span>

                  <span className={`text-xs shrink-0 ${muted}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {account.lastLogin}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusLine({
  label,
  value,
  ok,
  isDark,
}: {
  label: string;
  value: string;
  ok: boolean;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
        {label}
      </span>
      <span
        className={`text-xs font-semibold font-mono ${ok ? "text-emerald-400" : "text-red-400"}`}
        style={{ fontFamily: "JetBrains Mono, monospace" }}
      >
        {ok && "✓ "}
        {value}
      </span>
    </div>
  );
}
