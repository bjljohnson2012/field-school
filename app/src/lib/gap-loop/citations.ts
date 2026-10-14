export type Citation = { table: string; id: string; label: string; url?: string; retrieved?: string };

export type CitedNode = { id: string; evidence: Citation[] };
export type CitedEdge = { id: string; from: string; to: string; evidence: Citation[] };

export function assertEvidence(evidence: readonly Citation[]): Citation[] {
  if (!Array.isArray(evidence) || evidence.length < 1) {
    throw new Error("evidence_required");
  }
  const clean = evidence.map((item) => {
    const url = typeof item?.url === "string" ? item.url.trim() : "";
    const retrieved = typeof item?.retrieved === "string" ? item.retrieved.trim() : "";
    return {
      table: typeof item?.table === "string" ? item.table.trim() : "",
      id: typeof item?.id === "string" ? item.id.trim() : "",
      label: typeof item?.label === "string" ? item.label.trim() : "",
      ...(url ? { url } : {}),
      ...(retrieved ? { retrieved } : {}),
    };
  });
  if (clean.some((item) => !item.table || !item.id || !item.label)) {
    throw new Error("evidence_required");
  }
  return clean;
}

/** Drop a node and every edge that touches it. */
export function removeNode(nodes: readonly CitedNode[], edges: readonly CitedEdge[], nodeId: string) {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
  };
}
