"use client";

import { useCallback, useEffect, useState } from "react";

export type DashboardNodeStatus = "completed" | "active" | "locked";

export interface LiveGraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  office?: string;
  status?: DashboardNodeStatus;
  prerequisites?: string[];
}

export interface LiveGraphEdge {
  from: string;
  to: string;
}

export interface QueueEntry {
  id: number;
  office: string;
  date: string;
  time: string;
  slot: number;
  total: number;
}

export interface LiveClearanceRequest {
  id: string;
  studentAccountId: string;
  studentName: string;
  nodeId: string;
  status: "pending" | "approved" | "held";
  submittedAt: string;
  holdReason?: string;
}

export type StudentClearanceStatus = "pending" | "office" | "cleared";

export interface LiveStudentSummary {
  accountId: string;
  name: string;
  studentNumber: string;
  department: string;
}

export interface LiveDashboardState {
  graphNodes: LiveGraphNode[];
  graphEdges: LiveGraphEdge[];
  queue: QueueEntry[];
  facultyAvailability: "accepting" | "in-class" | "away";
  completedNodeIds: string[];
  requestDecisions: Record<string, "pending" | "approved" | "held">;
  clearanceRequests: LiveClearanceRequest[];
  students: Record<string, LiveStudentSummary>;
  studentClearanceRecords: Record<string, Record<string, StudentClearanceStatus>>;
  updatedAt: number;
}

const STORAGE_KEY = "clearance-flow-live-dashboard";
const EVENT_NAME = "clearance-flow-live-sync";

export const INITIAL_GRAPH_NODES: LiveGraphNode[] = [
  { id: "library", label: "Library", office: "University Library", status: "completed", prerequisites: [], x: 160, y: 70 },
  { id: "medical", label: "Medical", office: "Health Services Unit", status: "completed", prerequisites: [], x: 490, y: 70 },
  { id: "finance", label: "Finance", office: "Accounting Office", status: "active", prerequisites: ["library"], x: 80, y: 210 },
  { id: "sas", label: "SAS", office: "Student Affairs Office", status: "active", prerequisites: ["library"], x: 310, y: 210 },
  { id: "depthead", label: "Dept Head", office: "Department Office", status: "locked", prerequisites: ["finance", "sas"], x: 195, y: 360 },
  { id: "registrar", label: "Registrar", office: "Registrar's Office", status: "locked", prerequisites: ["depthead", "medical"], x: 370, y: 480 },
];

export const INITIAL_GRAPH_EDGES: LiveGraphEdge[] = [
  { from: "library", to: "finance" },
  { from: "library", to: "sas" },
  { from: "finance", to: "depthead" },
  { from: "sas", to: "depthead" },
  { from: "medical", to: "registrar" },
  { from: "depthead", to: "registrar" },
];

export const INITIAL_QUEUE: QueueEntry[] = [
  { id: 1, office: "Accounting Office", date: "Tue, Aug 26", time: "9:00 – 11:00 AM", slot: 3, total: 12 },
  { id: 2, office: "Student Affairs Office", date: "Tue, Aug 26", time: "1:00 – 3:00 PM", slot: 7, total: 20 },
];

export const DEFAULT_LIVE_STATE: LiveDashboardState = {
  graphNodes: INITIAL_GRAPH_NODES,
  graphEdges: INITIAL_GRAPH_EDGES,
  queue: INITIAL_QUEUE,
  facultyAvailability: "accepting",
  completedNodeIds: INITIAL_GRAPH_NODES.filter(node => node.status === "completed").map(node => node.id),
  requestDecisions: {},
  clearanceRequests: [],
  students: {},
  studentClearanceRecords: {},
  updatedAt: Date.now(),
};

const isBrowser = typeof window !== "undefined";

function normalizeLiveState(rawState: Partial<LiveDashboardState>): LiveDashboardState {
  const rawNodes = (rawState.graphNodes ?? INITIAL_GRAPH_NODES).map(node => ({
    ...node,
    id: node.id === "osas" ? "sas" : node.id,
    label: node.label === "OSAS" ? "SAS" : node.label,
    prerequisites: (node.prerequisites ?? []).map(prereq => prereq === "osas" ? "sas" : prereq),
  }));

  const graphEdges = (rawState.graphEdges ?? INITIAL_GRAPH_EDGES).map(edge => ({
    from: edge.from === "osas" ? "sas" : edge.from,
    to: edge.to === "osas" ? "sas" : edge.to,
  }));
  const prerequisitesByNode = new Map<string, string[]>();
  for (const edge of graphEdges) {
    prerequisitesByNode.set(edge.to, [...(prerequisitesByNode.get(edge.to) ?? []), edge.from]);
  }
  const nodesWithPrerequisites = rawNodes.map(node => ({
    ...node,
    prerequisites: prerequisitesByNode.get(node.id) ?? [],
  }));

  const completedNodeIds = rawState.completedNodeIds ?? nodesWithPrerequisites.filter(node => node.status === "completed").map(node => node.id);
  const completed = new Set(completedNodeIds);
  const graphNodes = nodesWithPrerequisites.map(node => ({
    ...node,
    status: completed.has(node.id)
      ? "completed" as const
      : (node.prerequisites ?? []).every(prerequisite => completed.has(prerequisite))
      ? "active" as const
      : "locked" as const,
  }));

  return {
    graphNodes,
    graphEdges,
    queue: rawState.queue ?? INITIAL_QUEUE,
    facultyAvailability: rawState.facultyAvailability ?? "accepting",
    completedNodeIds,
    requestDecisions: rawState.requestDecisions ?? {},
    clearanceRequests: rawState.clearanceRequests ?? [],
    students: rawState.students ?? {},
    studentClearanceRecords: rawState.studentClearanceRecords ?? {},
    updatedAt: rawState.updatedAt ?? Date.now(),
  };
}

function readPersistedState(): LiveDashboardState {
  if (!isBrowser) return DEFAULT_LIVE_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LIVE_STATE;
    const parsed = JSON.parse(raw) as Partial<LiveDashboardState>;
    return normalizeLiveState(parsed);
  } catch {
    return DEFAULT_LIVE_STATE;
  }
}

function persistState(nextState: LiveDashboardState) {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function emitSync(nextState: LiveDashboardState) {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: nextState }));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel("clearance-flow-live-dashboard");
    channel.postMessage(nextState);
    channel.close();
  }
}

export function useLiveDashboardState() {
  const [state, setState] = useState<LiveDashboardState>(() => readPersistedState());

  useEffect(() => {
    if (!isBrowser) return;

    const listener = (event: Event) => {
      const nextState = (event as CustomEvent<LiveDashboardState>).detail;
      if (nextState) {
        setState(nextState);
      }
    };

    const handleMessage = (event: MessageEvent<LiveDashboardState>) => {
      if (event.data) {
        setState(event.data);
      }
    };

    window.addEventListener(EVENT_NAME, listener);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("clearance-flow-live-dashboard");
      channel.addEventListener("message", handleMessage);
    }

    return () => {
      window.removeEventListener(EVENT_NAME, listener);
      channel?.removeEventListener("message", handleMessage);
      channel?.close();
    };
  }, []);

  const replaceState = useCallback((nextState: LiveDashboardState) => {
    persistState(nextState);
    emitSync(nextState);
    setState(nextState);
  }, []);

  const setGraph = useCallback((nodes: LiveGraphNode[], edges: LiveGraphEdge[]) => {
    setState(prev => {
      const next = normalizeLiveState({
        ...prev,
        graphNodes: nodes,
        graphEdges: edges,
        completedNodeIds: prev.completedNodeIds.filter(id => nodes.some(node => node.id === id)),
        studentClearanceRecords: Object.fromEntries(
          Object.entries(prev.studentClearanceRecords).map(([studentId, records]) => [
            studentId,
            Object.fromEntries(Object.entries(records).filter(([nodeId]) => nodes.some(node => node.id === nodeId))),
          ])
        ),
        updatedAt: Date.now(),
      });
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const setQueue = useCallback((queue: QueueEntry[]) => {
    setState(prev => {
      const next = { ...prev, queue, updatedAt: Date.now() };
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const setAvailability = useCallback((availability: "accepting" | "in-class" | "away") => {
    setState(prev => {
      const next = { ...prev, facultyAvailability: availability, updatedAt: Date.now() };
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const completeNode = useCallback((nodeId: string) => {
    setState(prev => {
      const completedNodeIds = prev.completedNodeIds.includes(nodeId)
        ? prev.completedNodeIds
        : [...prev.completedNodeIds, nodeId];
      const next = normalizeLiveState({ ...prev, completedNodeIds, updatedAt: Date.now() });
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const setRequestDecision = useCallback((requestId: string, decision: "pending" | "approved" | "held") => {
    setState(prev => {
      const next = normalizeLiveState({
        ...prev,
        requestDecisions: { ...prev.requestDecisions, [requestId]: decision },
        updatedAt: Date.now(),
      });
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const submitClearanceRequest = useCallback((request: Omit<LiveClearanceRequest, "id" | "status" | "submittedAt">) => {
    setState(prev => {
      const alreadySubmitted = prev.clearanceRequests.some(existing =>
        existing.studentAccountId === request.studentAccountId &&
        existing.nodeId === request.nodeId &&
        existing.status !== "held"
      );
      if (alreadySubmitted) return prev;
      const next = normalizeLiveState({
        ...prev,
        clearanceRequests: [
          ...prev.clearanceRequests,
          {
            ...request,
            id: `${request.studentAccountId}:${request.nodeId}:${Date.now()}`,
            status: "pending",
            submittedAt: new Date().toISOString(),
          },
        ],
        updatedAt: Date.now(),
      });
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const setClearanceRequestStatus = useCallback((requestId: string, status: LiveClearanceRequest["status"], holdReason?: string) => {
    setState(prev => {
      const next = normalizeLiveState({
        ...prev,
        clearanceRequests: prev.clearanceRequests.map(request =>
          request.id === requestId
            ? { ...request, status, ...(holdReason ? { holdReason } : { holdReason: undefined }) }
            : request
        ),
        updatedAt: Date.now(),
      });
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const registerStudent = useCallback((student: LiveStudentSummary) => {
    setState(prev => {
      const existingRecords = prev.studentClearanceRecords[student.accountId] ?? {};
      const requestRecords = Object.fromEntries(
        prev.clearanceRequests
          .filter(request => request.studentAccountId === student.accountId)
          .map(request => [
            request.nodeId,
            request.status === "approved" ? "cleared" : request.status === "held" ? "office" : "pending",
          ])
      ) as Record<string, StudentClearanceStatus>;
      const initialRecords = Object.fromEntries(
        prev.graphNodes
          .filter(node => node.status === "completed")
          .map(node => [node.id, "cleared" as const])
      );
      const next = normalizeLiveState({
        ...prev,
        students: { ...prev.students, [student.accountId]: student },
        studentClearanceRecords: {
          ...prev.studentClearanceRecords,
          [student.accountId]: { ...initialRecords, ...requestRecords, ...existingRecords },
        },
        updatedAt: Date.now(),
      });
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  const setStudentClearanceStatus = useCallback((
    studentAccountId: string,
    nodeId: string,
    status: StudentClearanceStatus,
    holdReason?: string,
  ) => {
    setState(prev => {
      const records = prev.studentClearanceRecords[studentAccountId] ?? {};
      const statusFor = (candidateNodeId: string): StudentClearanceStatus =>
        records[candidateNodeId] ??
        (prev.clearanceRequests.some(request =>
          request.studentAccountId === studentAccountId &&
          request.nodeId === candidateNodeId &&
          request.status === "approved"
        )
          ? "cleared"
          : prev.clearanceRequests.some(request =>
              request.studentAccountId === studentAccountId &&
              request.nodeId === candidateNodeId &&
              request.status === "held"
            )
            ? "office"
            : prev.graphNodes.find(node => node.id === candidateNodeId)?.status === "completed"
              ? "cleared"
              : "pending");
      const prerequisites = prev.graphEdges.filter(edge => edge.to === nodeId);
      if (status !== "pending" && !prerequisites.every(edge => statusFor(edge.from) === "cleared")) {
        return prev;
      }

      const resetNodeIds = new Set([nodeId]);
      if (status === "pending") {
        let expanded = true;
        while (expanded) {
          expanded = false;
          for (const edge of prev.graphEdges) {
            if (resetNodeIds.has(edge.from) && !resetNodeIds.has(edge.to)) {
              resetNodeIds.add(edge.to);
              expanded = true;
            }
          }
        }
      }
      const clearanceRequests = status === "pending"
        ? prev.clearanceRequests.filter(request =>
            request.studentAccountId !== studentAccountId || !resetNodeIds.has(request.nodeId)
          )
        : prev.clearanceRequests.map(request =>
            request.studentAccountId === studentAccountId && request.nodeId === nodeId
              ? {
                  ...request,
                  status: status === "cleared" ? "approved" as const : "held" as const,
                  holdReason: status === "office" ? holdReason ?? "Please visit the responsible office." : undefined,
                }
              : request
          );
      const next = normalizeLiveState({
        ...prev,
        studentClearanceRecords: {
          ...prev.studentClearanceRecords,
          [studentAccountId]: {
            ...records,
            ...Object.fromEntries([...resetNodeIds].map(resetId => [resetId, "pending" as const])),
            ...(status === "pending" ? {} : { [nodeId]: status }),
          },
        },
        clearanceRequests,
        updatedAt: Date.now(),
      });
      persistState(next);
      emitSync(next);
      return next;
    });
  }, []);

  return {
    state,
    replaceState,
    setGraph,
    setQueue,
    setAvailability,
    completeNode,
    setRequestDecision,
    submitClearanceRequest,
    setClearanceRequestStatus,
    registerStudent,
    setStudentClearanceStatus,
  };
}
