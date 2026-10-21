"use client";

import { useEffect, useMemo, useState } from "react";
import {
  runKahnSort,
  type AlgorithmEdge,
  type AlgorithmNode,
  type KahnResult,
} from "@/lib/clearanceAlgorithms";

interface Props {
  nodes: AlgorithmNode[];
  edges: AlgorithmEdge[];
  isDark: boolean;
  card: string;
  text: string;
  muted: string;
}

const DEFAULT_INPUT = `Library
Medical
Finance
Student Affairs
Department
Registrar

Library -> Finance
Library -> Student Affairs
Finance -> Department
Student Affairs -> Department
Department -> Registrar
Medical -> Registrar`;

function parseBoard(value: string): { nodes: AlgorithmNode[]; edges: AlgorithmEdge[] } {
  const [nodeBlock = "", ...edgeBlocks] = value.split(/\n\s*\n/);
  const labels = nodeBlock.split(/\r?\n/).map(label => label.trim()).filter(Boolean);
  const nodes = labels.map((label, index) => ({
    id: `n${index + 1}`,
    label,
    priority: labels.length - index,
  }));
  const idsByLabel = new Map(nodes.map(node => [node.label.toLowerCase(), node.id]));
  const edges = edgeBlocks.join("\n").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const match = line.match(/^(.+?)\s*->\s*(.+)$/);
    if (!match) throw new Error(`Invalid rule "${line}". Use "Prerequisite -> Requirement".`);
    const from = idsByLabel.get(match[1].trim().toLowerCase());
    const to = idsByLabel.get(match[2].trim().toLowerCase());
    if (!from || !to) throw new Error(`Rule "${line}" refers to a name not listed above.`);
    return { from, to };
  });
  return { nodes, edges };
}

export default function AlgorithmPlayground({ nodes: initialNodes, edges: initialEdges, isDark, card, text, muted }: Props) {
  const [customBoard, setCustomBoard] = useState(DEFAULT_INPUT);
  const [customMode, setCustomMode] = useState(false);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const board = useMemo(() => {
    if (!customMode) return { nodes: initialNodes, edges: initialEdges };
    try {
      return parseBoard(customBoard);
    } catch {
      return { nodes: [] as AlgorithmNode[], edges: [] as AlgorithmEdge[] };
    }
  }, [customMode, customBoard, initialNodes, initialEdges]);

  const result = useMemo<KahnResult | null>(() => {
    if (!board.nodes.length) return null;
    try {
      return runKahnSort(board.nodes, board.edges);
    } catch {
      return null;
    }
  }, [board]);

  useEffect(() => {
    if (!playing) return;
    if (!result || stepIndex >= result.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStepIndex(current => current + 1), 850);
    return () => window.clearTimeout(timer);
  }, [playing, result, stepIndex]);

  const activeId = stepIndex >= 0 ? result?.steps[stepIndex]?.selectedId : undefined;
  const processedIds = new Set(result?.steps.slice(0, stepIndex + 1).map(step => step.selectedId) ?? []);
  const availableIds = new Set(result?.steps[stepIndex]?.availableIds ?? (result?.steps.length ? [] : result?.order.slice(0, 0) ?? []));

  const reset = () => {
    setPlaying(false);
    setStepIndex(-1);
    setError("");
  };

  const loadCustomBoard = () => {
    try {
      const parsed = parseBoard(customBoard);
      if (!parsed.nodes.length) throw new Error("Add at least one requirement.");
      runKahnSort(parsed.nodes, parsed.edges);
      setCustomMode(true);
      setError("");
      reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to parse this graph.");
    }
  };

  const loadCurrentGraph = () => {
    setCustomMode(false);
    setError("");
    reset();
  };

  const panel = isDark ? "border-slate-700 bg-slate-950/60" : "border-slate-200 bg-slate-50";
  const button = "rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <section className={`rounded-2xl border p-5 ${card}`} aria-labelledby="algorithm-playground-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="algorithm-playground-title" className={`text-sm font-bold ${text}`}>Kahn's Algorithm + Greedy Scheduling</h2>
          <p className={`mt-1 max-w-3xl text-xs ${muted}`}>
            Kahn's algorithm repeatedly selects a requirement whose prerequisites are complete. A greedy priority rule
            chooses among currently eligible requirements; dependencies are never violated.
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono text-emerald-500">
          O((V + E) log V)
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`rounded-xl border p-4 ${panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`text-xs font-bold ${text}`}>{customMode ? "Custom requirements" : "Current clearance graph"}</h3>
            <div className="flex gap-2">
              {customMode
                ? <button type="button" className={`${button} border border-slate-600 ${muted}`} onClick={loadCurrentGraph}>Use current graph</button>
                : <button type="button" className={`${button} border border-blue-500/40 bg-blue-500/10 text-blue-500`} onClick={() => { setCustomMode(true); reset(); }}>Custom board</button>}
            </div>
          </div>

          {customMode && (
            <div className="mt-3">
              <label htmlFor="algorithm-board" className={`mb-1 block text-[11px] ${muted}`}>
                One requirement per line, a blank line, then rules in “A -&gt; B” form.
              </label>
              <textarea
                id="algorithm-board"
                value={customBoard}
                onChange={event => setCustomBoard(event.target.value)}
                rows={8}
                className={`w-full resize-y rounded-lg border p-3 text-xs leading-5 outline-none focus:border-blue-500 ${panel} ${text}`}
                spellCheck={false}
              />
              <button type="button" onClick={loadCustomBoard} className={`${button} mt-2 bg-blue-600 text-white`}>Load custom graph</button>
            </div>
          )}

          {error && <p role="alert" className="mt-3 text-xs text-rose-500">{error}</p>}
          {result ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Requirements in current graph">
                {board.nodes.map(node => {
                  const state = node.id === activeId ? "active" : processedIds.has(node.id) ? "done" : availableIds.has(node.id) ? "ready" : "waiting";
                  const stateStyles = {
                    active: "border-blue-500 bg-blue-500 text-white",
                    done: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
                    ready: "border-amber-500/40 bg-amber-500/10 text-amber-500",
                    waiting: "border-slate-500/30 text-slate-500",
                  };
                  return <span key={node.id} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${stateStyles[state]}`}>{node.label}</span>;
                })}
              </div>
              <div className={`mt-4 rounded-lg border p-3 ${card}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>Topological order</p>
                <p className={`mt-1 text-xs ${text}`}>
                  {processedIds.size ? board.nodes.filter(node => processedIds.has(node.id)).map(node => node.label).join(" → ") : "Press Play or Step to start"}
                </p>
                {result.hasCycle && <p className="mt-2 text-xs text-rose-500">Cycle detected: {result.cycleNodeIds.map(id => board.nodes.find(node => node.id === id)?.label ?? id).join(", ")}</p>}
              </div>
            </>
          ) : (
            <p className="mt-4 text-xs text-slate-500">The graph input is invalid. Correct it and load the board again.</p>
          )}
        </div>

        <aside className="space-y-4">
          <div className={`rounded-xl border p-4 ${panel}`}>
            <h3 className={`text-xs font-bold ${text}`}>Step controls</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={`${button} bg-emerald-600 text-white`} onClick={() => { if (result && stepIndex < result.steps.length - 1) setPlaying(true); }} disabled={!result || stepIndex >= result.steps.length - 1}>Play</button>
              <button type="button" className={`${button} border border-slate-600 ${muted}`} onClick={() => setPlaying(false)} disabled={!playing}>Pause</button>
              <button type="button" className={`${button} bg-blue-600 text-white`} onClick={() => { setPlaying(false); setStepIndex(index => Math.min(index + 1, (result?.steps.length ?? 1) - 1)); }} disabled={!result || stepIndex >= result.steps.length - 1}>Step</button>
              <button type="button" className={`${button} border border-slate-600 ${muted}`} onClick={reset}>Reset</button>
            </div>
            <p className={`mt-3 text-xs ${muted}`} aria-live="polite">
              {result?.hasCycle
                ? "This graph contains a cycle, so no complete topological order exists."
                : result && stepIndex >= result.steps.length - 1
                  ? `Complete: ${result.order.length} requirements ordered.`
                  : `Step ${Math.max(0, stepIndex + 1)} of ${result?.steps.length ?? 0}`}
            </p>
          </div>

          <div className={`rounded-xl border p-4 ${panel}`}>
            <h3 className={`text-xs font-bold ${text}`}>Greedy queue</h3>
            <p className={`mt-1 text-[11px] ${muted}`}>Only zero-indegree requirements are eligible. Highest priority wins ties in dependency readiness.</p>
            <div className="mt-3 space-y-1">
              {(stepIndex >= 0 ? result?.steps[stepIndex]?.availableIds ?? [] : result?.steps.length ? board.nodes.filter(node => !board.edges.some(edge => edge.to === node.id)).map(node => node.id) : []).map(id => (
                <div key={id} className="flex items-center justify-between rounded-md bg-slate-800/40 px-2 py-1.5 text-[11px]">
                  <span className={text}>{board.nodes.find(node => node.id === id)?.label ?? id}</span>
                  <span className="font-mono text-amber-500">priority {board.nodes.findIndex(node => node.id === id) + 1}</span>
                </div>
              ))}
              {(!result || (stepIndex >= 0 && !result.steps[stepIndex]?.availableIds.length)) && <p className={`text-[11px] ${muted}`}>No currently available requirement.</p>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
