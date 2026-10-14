import { isPendingSuggestion, type NodeScope } from "./kinds.ts";

export type BrainNode = {
  id: string;
  orgId: string;
  growthUnitId: string;
  ownerKind: string;
  ownerMembershipId: string;
  childMembershipId: string | null;
  kind: string;
  label: string;
  body: string;
  refTable: string | null;
  refId: string | null;
  evidence: readonly unknown[];
  status: string;
};

export type BrainEdge = {
  id: string;
  orgId: string;
  fromNode: string;
  toNode: string;
  rel: string;
  because: string;
  origin: string;
  status: string;
  evidence: readonly unknown[];
};

export type BrainRow = {
  id: string;
  orgId: string;
  growthUnitId: string;
  status: string;
  createdAt?: string;
};

export type BrainViewFilter = {
  orgId: string;
  room?: "household" | "sales" | null;
  growthUnitId?: string | null;
  childMembershipId?: string | null;
};

/** One knowledge_brains row is a brain. The org default is a single brain, not one per growth unit. */
export function resolveOrgBrain(rows: readonly BrainRow[], orgId: string): BrainRow | null {
  const mine = rows.filter((row) => row.orgId === orgId);
  const current = mine.filter((row) => row.status === "current");
  const pool = current.length > 0 ? current : mine;
  const sorted = [...pool].sort((left, right) => {
    const time = (left.createdAt || "").localeCompare(right.createdAt || "");
    return time || left.id.localeCompare(right.id);
  });
  return sorted[0] ?? null;
}

export function listGapLoopEdges<T extends { status: string }>(edges: readonly T[]): T[] {
  return edges.filter((edge) => edge.status !== "rejected");
}

function onDesk(node: BrainNode, room: BrainViewFilter["room"]) {
  if (room !== "sales") return true;
  return node.ownerKind !== "child" && !node.childMembershipId;
}

function inFilter(node: BrainNode, filter: BrainViewFilter) {
  if (node.orgId !== filter.orgId) return false;
  if (node.status === "rejected") return false;
  if (!onDesk(node, filter.room)) return false;
  if (filter.growthUnitId && node.growthUnitId !== filter.growthUnitId) return false;
  if (filter.childMembershipId && node.childMembershipId !== filter.childMembershipId) return false;
  return true;
}

/**
 * One org brain. Growth units and desk children are filters inside it.
 * Rejected edges stay out of the graph, the list, and gap-loop reads.
 */
export function loadBrainGraph(input: {
  brains?: readonly BrainRow[];
  nodes: readonly BrainNode[];
  edges: readonly BrainEdge[];
  filter: BrainViewFilter;
}) {
  const brain = resolveOrgBrain(input.brains ?? [], input.filter.orgId);
  const nodes = input.nodes.filter((node) => inFilter(node, input.filter));
  const ids = new Set(nodes.map((node) => node.id));
  const edges = listGapLoopEdges(input.edges).filter(
    (edge) => edge.orgId === input.filter.orgId && ids.has(edge.fromNode) && ids.has(edge.toNode),
  );
  return { brainId: brain?.id ?? null, nodes, edges };
}

export function canSeeBrainNode(
  actor: { orgId: string; membershipId: string; kind: string },
  node: Pick<BrainNode, "orgId" | "ownerMembershipId">,
  staff: boolean,
) {
  if (actor.kind === "child") return false;
  if (node.orgId !== actor.orgId) return false;
  if (staff) return true;
  return node.ownerMembershipId === actor.membershipId;
}

export function edgePresentation(edge: Pick<BrainEdge, "origin" | "status">) {
  return {
    pending: isPendingSuggestion(edge),
    hidden: edge.status === "rejected",
  };
}

export function scopeKey(scope: Pick<NodeScope, "orgId" | "growthUnitId" | "childMembershipId">) {
  return `${scope.orgId}:${scope.growthUnitId}:${scope.childMembershipId ?? ""}`;
}
