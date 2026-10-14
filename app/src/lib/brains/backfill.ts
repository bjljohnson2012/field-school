import type { EdgeOrigin } from "./kinds.ts";

export type Citation = { table: string; id: string; label: string };

export type BackfillNode = {
  key: string;
  kind: "brain_page" | "skill" | "project";
  label: string;
  body: string;
  refTable: string;
  refId: string;
  evidence: Citation[];
};

export type BackfillEdge = {
  fromKey: string;
  toKey: string;
  rel: "supports";
  origin: Extract<EdgeOrigin, "derived">;
  because: string;
  evidence: Citation[];
};

export type BackfillSource = {
  id: string;
  title: string;
  body?: string;
  composerUnitId?: string | null;
};

export type BackfillUnit = { id: string; title: string; body?: string };

export type ExistingNode = { refTable: string | null; refId: string | null; kind: string };

export type BackfillInput = {
  brainSources: readonly BackfillSource[];
  brainNotes: readonly BackfillSource[];
  brainArtifacts: readonly BackfillSource[];
  knowledgeUnits: readonly BackfillUnit[];
  coachingUnits: readonly BackfillUnit[];
  existingNodes: readonly ExistingNode[];
};

const STORE_KEYS = [
  "brain_sources",
  "brain_notes",
  "brain_artifacts",
  "knowledge_units",
  "coaching_knowledge_units",
  "knowledge_nodes",
] as const;

export type StoreCounts = Record<(typeof STORE_KEYS)[number], number>;

function cite(table: string, id: string, label: string): Citation[] {
  return [{ table, id, label: label || table }];
}

function already(existing: readonly ExistingNode[], refTable: string, refId: string, kind: string) {
  return existing.some((node) => node.refTable === refTable && node.refId === refId && node.kind === kind);
}

function pageNode(table: string, row: BackfillSource, existing: readonly ExistingNode[]): BackfillNode | null {
  if (already(existing, table, row.id, "brain_page")) return null;
  const label = row.title || table;
  return {
    key: `${table}:${row.id}`,
    kind: "brain_page",
    label,
    body: row.body || "",
    refTable: table,
    refId: row.id,
    evidence: cite(table, row.id, label),
  };
}

export function backfillCounts(input: BackfillInput): StoreCounts {
  return {
    brain_sources: input.brainSources.length,
    brain_notes: input.brainNotes.length,
    brain_artifacts: input.brainArtifacts.length,
    knowledge_units: input.knowledgeUnits.length,
    coaching_knowledge_units: input.coachingUnits.length,
    knowledge_nodes: input.existingNodes.length,
  };
}

export function formatDryRun(counts: StoreCounts, plannedInserts: number) {
  const lines = STORE_KEYS.map((key) => `${key} ${counts[key]}`);
  lines.push(`planned_inserts ${plannedInserts}`);
  return lines.join("\n");
}

/** Idempotent plan. Existing gap-loop nodes are counted and left unchanged. */
export function planBackfill(input: BackfillInput): {
  counts: StoreCounts;
  nodes: BackfillNode[];
  edges: BackfillEdge[];
  plannedInserts: number;
} {
  const nodes: BackfillNode[] = [];
  for (const row of input.brainSources) {
    const node = pageNode("brain_sources", row, input.existingNodes);
    if (node) nodes.push(node);
  }
  for (const row of input.brainNotes) {
    const node = pageNode("brain_notes", row, input.existingNodes);
    if (node) nodes.push(node);
  }
  for (const row of input.brainArtifacts) {
    const node = pageNode("brain_artifacts", row, input.existingNodes);
    if (node) nodes.push(node);
  }
  for (const row of input.knowledgeUnits) {
    if (already(input.existingNodes, "knowledge_units", row.id, "skill")) continue;
    const label = row.title || "Skill";
    nodes.push({
      key: `knowledge_units:${row.id}`,
      kind: "skill",
      label,
      body: row.body || "",
      refTable: "knowledge_units",
      refId: row.id,
      evidence: cite("knowledge_units", row.id, label),
    });
  }
  for (const row of input.coachingUnits) {
    if (already(input.existingNodes, "coaching_knowledge_units", row.id, "project")) continue;
    const label = row.title || "Project";
    nodes.push({
      key: `coaching_knowledge_units:${row.id}`,
      kind: "project",
      label,
      body: row.body || "",
      refTable: "coaching_knowledge_units",
      refId: row.id,
      evidence: cite("coaching_knowledge_units", row.id, label),
    });
  }

  const edges: BackfillEdge[] = [];
  const skillIds = new Set(input.knowledgeUnits.map((row) => row.id));
  const pages = [
    ...input.brainSources.map((row) => ({ table: "brain_sources", row })),
    ...input.brainNotes.map((row) => ({ table: "brain_notes", row })),
    ...input.brainArtifacts.map((row) => ({ table: "brain_artifacts", row })),
  ];
  for (const { table, row } of pages) {
    const unitId = row.composerUnitId || "";
    if (!unitId || !skillIds.has(unitId)) continue;
    const fromKey = `${table}:${row.id}`;
    const toKey = `knowledge_units:${unitId}`;
    if (!nodes.some((node) => node.key === fromKey) || !nodes.some((node) => node.key === toKey)) continue;
    const label = row.title || table;
    edges.push({
      fromKey,
      toKey,
      rel: "supports",
      origin: "derived",
      because: "This brain page cites the skill.",
      evidence: cite(table, row.id, label),
    });
  }

  return {
    counts: backfillCounts(input),
    nodes,
    edges,
    plannedInserts: nodes.length,
  };
}

export function applyBackfill(input: BackfillInput) {
  const plan = planBackfill(input);
  const existingNodes: ExistingNode[] = [
    ...input.existingNodes,
    ...plan.nodes.map((node) => ({ refTable: node.refTable, refId: node.refId, kind: node.kind })),
  ];
  return { plan, existingNodes };
}

export const FIXTURE_BACKFILL: BackfillInput = {
  brainSources: [{ id: "s1", title: "Field note", body: "A source", composerUnitId: "u1" }],
  brainNotes: [{ id: "n1", title: "Desk note", body: "A note" }],
  brainArtifacts: [{ id: "a1", title: "Worksheet", body: "An artifact" }],
  knowledgeUnits: [{ id: "u1", title: "Name the work", body: "A unit" }],
  coachingUnits: [{ id: "c1", title: "Coaching article", body: "A project" }],
  existingNodes: [
    { refTable: "outcomes", refId: "o1", kind: "goal" },
    { refTable: "outcomes", refId: "o2", kind: "goal" },
  ],
};
