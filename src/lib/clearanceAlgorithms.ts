export interface AlgorithmNode {
  id: string;
  label: string;
  priority?: number;
}

export interface AlgorithmEdge {
  from: string;
  to: string;
}

export interface KahnStep {
  selectedId: string;
  availableIds: string[];
  remainingIndegree: Record<string, number>;
}

export interface KahnResult {
  order: string[];
  steps: KahnStep[];
  hasCycle: boolean;
  cycleNodeIds: string[];
}

export function runKahnSort(nodes: AlgorithmNode[], edges: AlgorithmEdge[]): KahnResult {
  const nodeIds = new Set(nodes.map(node => node.id));
  if (nodeIds.size !== nodes.length) {
    throw new Error("Node IDs must be unique.");
  }

  const outgoing = new Map(nodes.map(node => [node.id, [] as string[]]));
  const indegree = new Map(nodes.map(node => [node.id, 0]));
  const uniqueEdges = new Set<string>();

  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error("Every rule must connect two existing requirements.");
    }
    if (edge.from === edge.to) {
      throw new Error("A requirement cannot depend on itself.");
    }
    const edgeKey = `${edge.from}\u0000${edge.to}`;
    if (uniqueEdges.has(edgeKey)) {
      throw new Error("Duplicate prerequisite rules are not allowed.");
    }
    uniqueEdges.add(edgeKey);
    outgoing.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, indegree.get(edge.to)! + 1);
  }

  const priority = new Map(nodes.map((node, index) => [node.id, node.priority ?? -index]));
  const compare = (left: string, right: string) =>
    (priority.get(right)! - priority.get(left)!) || left.localeCompare(right);
  const available = nodes.filter(node => indegree.get(node.id) === 0).map(node => node.id);
  const order: string[] = [];
  const steps: KahnStep[] = [];

  while (available.length > 0) {
    available.sort(compare);
    const selectedId = available.shift()!;
    order.push(selectedId);

    for (const nextId of outgoing.get(selectedId)!) {
      const nextIndegree = indegree.get(nextId)! - 1;
      indegree.set(nextId, nextIndegree);
      if (nextIndegree === 0) available.push(nextId);
    }

    steps.push({
      selectedId,
      availableIds: [...available].sort(compare),
      remainingIndegree: Object.fromEntries(indegree),
    });
  }

  const cycleNodeIds = nodes.filter(node => indegree.get(node.id)! > 0).map(node => node.id);
  return { order, steps, hasCycle: cycleNodeIds.length > 0, cycleNodeIds };
}

export interface PriorityRequest {
  id: string;
  examDaysRemaining: number | null;
  completedPrerequisites: number;
  totalPrerequisites: number;
  submittedAt: number;
}

export function scoreGreedyPriority(request: PriorityRequest, now = Date.now()): number {
  const examUrgency = request.examDaysRemaining === null
    ? 0
    : request.examDaysRemaining <= 0
      ? 100
      : request.examDaysRemaining <= 7
        ? 90
        : request.examDaysRemaining <= 14
          ? 70
          : request.examDaysRemaining <= 30
            ? 50
            : 20;
  const prerequisites = request.totalPrerequisites <= 0
    ? 50
    : 50 * Math.min(1, Math.max(0, request.completedPrerequisites / request.totalPrerequisites));
  const ageHours = Math.max(0, now - request.submittedAt) / 3_600_000;
  return Number((examUrgency + prerequisites + Math.min(10, ageHours)).toFixed(2));
}

export function sortByGreedyPriority<T extends PriorityRequest>(requests: T[], now = Date.now()): T[] {
  return [...requests].sort((left, right) =>
    scoreGreedyPriority(right, now) - scoreGreedyPriority(left, now)
    || left.submittedAt - right.submittedAt
    || left.id.localeCompare(right.id)
  );
}
