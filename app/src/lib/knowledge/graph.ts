import type { Room } from "../living-brain/model.ts";
import type { Milestone, MilestoneSource, PersonRef } from "../records/model.ts";

export type EntityRef =
  | { kind: "brain"; id: string }
  | { kind: "lesson"; id: string }
  | { kind: "person"; person: PersonRef }
  | { kind: "milestone"; id: string };

export type Entity = { key: string; ref: EntityRef; label: string; href: string | null };

export type BrainItemTable = "brain_sources" | "brain_notes" | "brain_artifacts";

export type Evidence =
  | { kind: "brain-item"; table: BrainItemTable; rowId: string; title: string; unitId: string; unitTitle: string }
  | { kind: "milestone"; source: MilestoneSource; at: string };

/** An edge cannot be typed without at least one evidence row, so every edge can explain itself. */
export type Edge = {
  key: string;
  rel: "draws-on" | "reached";
  from: string;
  to: string;
  because: string;
  evidence: readonly [Evidence, ...Evidence[]];
};

export type Graph = { entities: readonly Entity[]; edges: readonly Edge[] };

export const EMPTY_GRAPH: Graph = { entities: [], edges: [] };

/** What a surface asks about: the brain page, the Library desk, your profile, your family, or one child. */
export type GraphFocus =
  | { kind: "brains" }
  | { kind: "library"; lessonIds?: readonly string[] }
  | { kind: "self" }
  | { kind: "family" }
  | { kind: "child"; membershipId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LESSONS = 100;

export function parseFocus(focus: string | null, lessons: string | null = null): GraphFocus | null {
  if (focus === "brains" || focus === "self" || focus === "family") return { kind: focus };
  if (focus === "library") {
    if (!lessons) return { kind: "library" };
    const ids = lessons.split(",").filter(Boolean);
    if (ids.length > MAX_LESSONS || !ids.every((id) => UUID.test(id))) return null;
    return { kind: "library", lessonIds: ids };
  }
  const child = focus?.startsWith("child:") ? focus.slice("child:".length) : null;
  return child && UUID.test(child) ? { kind: "child", membershipId: child } : null;
}

export function entityKey(ref: EntityRef): string {
  if (ref.kind === "person") {
    return ref.person.as === "self" ? `person:self:${ref.person.memberId}` : `person:child:${ref.person.membershipId}`;
  }
  return `${ref.kind}:${ref.id}`;
}

export type BrainLessonRows = {
  brains: readonly { id: string; title: string; childMembershipId: string | null }[];
  items: readonly { table: BrainItemTable; id: string; brainId: string; title: string; unitId: string }[];
  units: readonly { id: string; lessonId: string | null; title: string }[];
  lessons: readonly { id: string; title: string }[];
};

/** Sales never sees a tracked child's brain. Household sees family and child brains. */
export function brainsForRoom<T extends { childMembershipId: string | null }>(room: Room | null, brains: readonly T[]) {
  return room === "sales" ? brains.filter((brain) => brain.childMembershipId === null) : [...brains];
}

const ITEM_NOUN: Record<BrainItemTable, [string, string]> = {
  brain_sources: ["source", "sources"],
  brain_notes: ["note", "notes"],
  brain_artifacts: ["artifact", "artifacts"],
};

function countPhrase(evidence: readonly Extract<Evidence, { kind: "brain-item" }>[]) {
  const parts: string[] = [];
  for (const table of Object.keys(ITEM_NOUN) as BrainItemTable[]) {
    const n = evidence.filter((row) => row.table === table).length;
    if (n) parts.push(`${n} ${ITEM_NOUN[table][n === 1 ? 0 : 1]}`);
  }
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
}

/**
 * One edge per (brain, lesson). Evidence is every brain item whose knowledge unit belongs to that
 * lesson. Items on a unit with no lesson, or on a unit or lesson outside the rows, drop.
 */
export function brainLessonGraph(rows: BrainLessonRows, lessonHref: (lessonId: string) => string): Graph {
  const brains = new Map(rows.brains.map((brain) => [brain.id, brain]));
  const units = new Map(rows.units.map((unit) => [unit.id, unit]));
  const lessons = new Map(rows.lessons.map((lesson) => [lesson.id, lesson]));
  const grouped = new Map<string, { brainId: string; lessonId: string; evidence: Extract<Evidence, { kind: "brain-item" }>[] }>();
  for (const item of rows.items) {
    const unit = units.get(item.unitId);
    if (!brains.has(item.brainId) || !unit?.lessonId || !lessons.has(unit.lessonId)) continue;
    const key = `${item.brainId}|${unit.lessonId}`;
    const group = grouped.get(key) ?? { brainId: item.brainId, lessonId: unit.lessonId, evidence: [] };
    group.evidence.push({ kind: "brain-item", table: item.table, rowId: item.id, title: item.title, unitId: unit.id, unitTitle: unit.title });
    grouped.set(key, group);
  }
  const entities = new Map<string, Entity>();
  const edges: Edge[] = [];
  for (const group of grouped.values()) {
    const [first, ...rest] = group.evidence;
    if (!first) continue;
    const brain = brains.get(group.brainId);
    const lesson = lessons.get(group.lessonId);
    if (!brain || !lesson) continue;
    const from = entityKey({ kind: "brain", id: brain.id });
    const to = entityKey({ kind: "lesson", id: lesson.id });
    entities.set(from, { key: from, ref: { kind: "brain", id: brain.id }, label: brain.title, href: "/brain" });
    entities.set(to, { key: to, ref: { kind: "lesson", id: lesson.id }, label: lesson.title, href: lessonHref(lesson.id) });
    const unitTitles = [...new Set(group.evidence.map((row) => row.unitTitle))];
    edges.push({
      key: `draws-on:${from}->${to}`,
      rel: "draws-on",
      from,
      to,
      because: `${countPhrase(group.evidence)} in this brain cite ${unitTitles.length === 1 ? "a unit" : `${unitTitles.length} units`} from this lesson (${unitTitles.join(", ")}).`,
      evidence: [first, ...rest],
    });
  }
  return { entities: [...entities.values()], edges };
}

export function personMilestoneGraph(
  person: { ref: PersonRef; label: string; href: string | null },
  milestones: readonly Milestone[],
): Graph {
  const from = entityKey({ kind: "person", person: person.ref });
  const entities: Entity[] = [{ key: from, ref: { kind: "person", person: person.ref }, label: person.label, href: person.href }];
  const edges: Edge[] = [];
  for (const milestone of milestones) {
    if (entityKey({ kind: "person", person: milestone.subject }) !== from) continue;
    const to = entityKey({ kind: "milestone", id: milestone.id });
    entities.push({ key: to, ref: { kind: "milestone", id: milestone.id }, label: milestone.title, href: null });
    edges.push({
      key: `reached:${from}->${to}`,
      rel: "reached",
      from,
      to,
      because: `${person.label} reached this on ${milestone.at.slice(0, 10)}.`,
      evidence: [{ kind: "milestone", source: milestone.source, at: milestone.at }],
    });
  }
  return { entities, edges };
}

export function mergeGraphs(...graphs: readonly Graph[]): Graph {
  const entities = new Map<string, Entity>();
  const edges = new Map<string, Edge>();
  for (const graph of graphs) {
    for (const entity of graph.entities) entities.set(entity.key, entity);
    for (const edge of graph.edges) edges.set(edge.key, edge);
  }
  return { entities: [...entities.values()], edges: [...edges.values()] };
}

/** Edges touching `key`, each with the entity on the other end. */
export function neighbors(graph: Graph, key: string): { edge: Edge; other: Entity }[] {
  const byKey = new Map(graph.entities.map((entity) => [entity.key, entity]));
  return graph.edges.flatMap((edge) => {
    const otherKey = edge.from === key ? edge.to : edge.to === key ? edge.from : null;
    const other = otherKey ? byKey.get(otherKey) : undefined;
    return other ? [{ edge, other }] : [];
  });
}

/** What crosses to a browser: labels, links, the reason, and evidence already written out. */
export type EdgeEnd = { key: string; label: string; href: string | null };
export type EdgeView = { key: string; rel: Edge["rel"]; from: EdgeEnd; to: EdgeEnd; because: string; evidence: readonly string[] };

export function edgeViews(graph: Graph, focusKey?: string): EdgeView[] {
  const byKey = new Map(graph.entities.map((entity) => [entity.key, entity]));
  const edges = focusKey ? neighbors(graph, focusKey).map(({ edge }) => edge) : graph.edges;
  return edges.flatMap((edge) => {
    const from = byKey.get(edge.from);
    const to = byKey.get(edge.to);
    if (!from || !to) return [];
    const end = (entity: Entity): EdgeEnd => ({ key: entity.key, label: entity.label, href: entity.href });
    return [{ key: edge.key, rel: edge.rel, from: end(from), to: end(to), because: edge.because, evidence: edge.evidence.map(evidenceLine) }];
  });
}

function text(raw: object, key: string): string | null {
  const value: unknown = Object.getOwnPropertyDescriptor(raw, key)?.value;
  return typeof value === "string" ? value : null;
}

function readEnd(raw: unknown): EdgeEnd | null {
  if (typeof raw !== "object" || raw === null) return null;
  const key = text(raw, "key");
  const label = text(raw, "label");
  const href: unknown = Object.getOwnPropertyDescriptor(raw, "href")?.value;
  if (key === null || label === null || (href !== null && typeof href !== "string")) return null;
  return { key, label, href };
}

function readView(raw: unknown): EdgeView | null {
  if (typeof raw !== "object" || raw === null) return null;
  const key = text(raw, "key");
  const rel = text(raw, "rel");
  const because = text(raw, "because");
  const from = readEnd(Object.getOwnPropertyDescriptor(raw, "from")?.value);
  const to = readEnd(Object.getOwnPropertyDescriptor(raw, "to")?.value);
  const evidence: unknown = Object.getOwnPropertyDescriptor(raw, "evidence")?.value;
  if (key === null || because === null || !from || !to || (rel !== "draws-on" && rel !== "reached")) return null;
  if (!Array.isArray(evidence)) return null;
  const lines: unknown[] = evidence;
  if (!lines.every((line): line is string => typeof line === "string")) return null;
  return { key, rel, from, to, because, evidence: lines };
}

/** Parses the `edges` array of an /api/knowledge/edges response; null when any row is malformed. */
export function parseEdgeViews(json: unknown): EdgeView[] | null {
  if (typeof json !== "object" || json === null) return null;
  const edges: unknown = Object.getOwnPropertyDescriptor(json, "edges")?.value;
  if (!Array.isArray(edges)) return null;
  const rows: unknown[] = edges;
  const views = rows.map(readView);
  return views.every((view): view is EdgeView => view !== null) ? views : null;
}

export function evidenceLine(evidence: Evidence): string {
  if (evidence.kind === "brain-item") {
    return `${ITEM_NOUN[evidence.table][0]} “${evidence.title || "untitled"}” → unit “${evidence.unitTitle}” (${evidence.table} ${evidence.rowId.slice(0, 8)})`;
  }
  const source = evidence.source;
  const row =
    source.table === "user_profiles.gates"
      ? source.gate
      : source.table === "tool_results"
        ? source.attemptId.slice(0, 8)
        : source.table === "progress_ledger_units"
          ? source.rowId.slice(0, 8)
          : source.table === "kid_profiles.intake_done_at"
            ? source.childMembershipId.slice(0, 8)
            : source.memberId.slice(0, 8);
  return `${source.table} ${row} · ${evidence.at.slice(0, 10)}`;
}
