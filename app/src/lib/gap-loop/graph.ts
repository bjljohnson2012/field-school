import { scoredEdgeWeight } from "./score.ts";

export type GraphCitation = { table: string; id: string; label: string };

export type GraphInputNode = {
  id: string;
  kind: string;
  label: string;
  requirementId?: string | null;
  evidence?: readonly GraphCitation[];
};

export type GraphInputEdge = {
  id: string;
  from: string;
  to: string;
  rel: string;
  status: string;
  weight: number;
};

export type GraphInputGap = {
  id: string;
  requirementId: string;
  summary: string;
  status: string;
  evidence?: readonly GraphCitation[];
};

export type GapGraph = {
  nodes: { id: string; kind: string; label: string; clusterId: string; x: number; y: number }[];
  edges: { id: string; from: string; to: string; rel: string; status: string; weight: number; dashed: boolean }[];
  clusters: { id: string; label: string; summary: string; citations: GraphCitation[] }[];
  gaps: { id: string; requirementId: string; summary: string; citations: GraphCitation[] }[];
};

function citationsOf(rows: readonly GraphCitation[] | undefined) {
  return (rows || []).filter((row) => row.table && row.id && row.label);
}

function propagate(nodes: readonly GraphInputNode[], edges: readonly GraphInputEdge[]) {
  const ids = nodes.map((node) => node.id).sort((a, b) => a.localeCompare(b));
  const label = new Map(ids.map((id) => [id, id]));
  const neighbors = new Map<string, { other: string; weight: number }[]>(ids.map((id) => [id, []]));
  for (const edge of [...edges].sort((a, b) => a.id.localeCompare(b.id))) {
    const weight = scoredEdgeWeight(edge.status, edge.weight);
    if (weight <= 0 || !neighbors.has(edge.from) || !neighbors.has(edge.to)) continue;
    neighbors.get(edge.from)?.push({ other: edge.to, weight });
    neighbors.get(edge.to)?.push({ other: edge.from, weight });
  }
  const passes = Math.max(1, ids.length);
  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Map(label);
    for (const id of ids) {
      const totals = new Map<string, number>();
      const own = label.get(id) || id;
      totals.set(own, 1);
      for (const link of neighbors.get(id) || []) {
        const other = label.get(link.other) || link.other;
        totals.set(other, (totals.get(other) || 0) + link.weight);
      }
      let best = own;
      let bestScore = -1;
      for (const [name, score] of [...totals.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        if (score > bestScore) {
          best = name;
          bestScore = score;
        }
      }
      next.set(id, best);
    }
    for (const [id, name] of next) label.set(id, name);
  }
  return label;
}

export function buildGapGraph(input: {
  nodes: readonly GraphInputNode[];
  edges: readonly GraphInputEdge[];
  gaps: readonly GraphInputGap[];
}): GapGraph {
  const nodes = [...input.nodes].sort((a, b) => a.id.localeCompare(b.id));
  const labels = propagate(nodes, input.edges);
  const openRequirements = new Set(
    input.gaps.filter((gap) => gap.status === "open" || gap.status === "asked" || gap.status === "closing").map((gap) => gap.requirementId),
  );
  const requirementOf = new Map(nodes.filter((node) => node.requirementId).map((node) => [node.id, node.requirementId || ""]));
  const laid = nodes.map((node, index) => {
    const angle = nodes.length ? (index / nodes.length) * Math.PI * 2 - Math.PI / 2 : 0;
    return {
      id: node.id,
      kind: node.kind,
      label: node.label,
      clusterId: labels.get(node.id) || node.id,
      x: Math.round(200 + Math.cos(angle) * 140),
      y: Math.round(150 + Math.sin(angle) * 100),
    };
  });
  const groups = new Map<string, GraphInputNode[]>();
  for (const node of nodes) {
    const id = labels.get(node.id) || node.id;
    const list = groups.get(id) || [];
    list.push(node);
    groups.set(id, list);
  }
  const clusters = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, members]) => {
      const citations = members.flatMap((member) => citationsOf(member.evidence)).slice(0, 4);
      const label = members.map((member) => member.label).sort((a, b) => a.localeCompare(b))[0] || "Cluster";
      const summary = citations.length ? citations.map((row) => row.label).join(", ") : label;
      return { id, label, summary, citations };
    });
  const edges = [...input.edges]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((edge) => {
      const fromReq = requirementOf.get(edge.from) || "";
      const toReq = requirementOf.get(edge.to) || "";
      const dashed = openRequirements.has(fromReq) || openRequirements.has(toReq);
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        rel: edge.rel,
        status: edge.status,
        weight: scoredEdgeWeight(edge.status, edge.weight),
        dashed,
      };
    });
  const gaps = [...input.gaps]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((gap) => ({
      id: gap.id,
      requirementId: gap.requirementId,
      summary: gap.summary,
      citations: citationsOf(gap.evidence),
    }));
  return { nodes: laid, edges, clusters, gaps };
}

/** Same clusters, gaps, and node ids as the graph. The list is not a second scoring pass. */
export function graphList(graph: GapGraph) {
  return {
    nodes: graph.nodes.map((node) => ({ id: node.id, label: node.label, clusterId: node.clusterId })),
    clusters: graph.clusters,
    gaps: graph.gaps,
  };
}
