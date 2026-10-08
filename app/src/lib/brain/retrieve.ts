import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { brainArtifacts, brainNotes, brainSources } from "@/lib/db/schema";

/**
 * Org-scoped brain retrieval over Postgres.
 * One org per call. Embeddings are not written. Qdrant is not used.
 */
export type BrainRetrieveQuery = {
  orgId: string;
  text: string;
  limit?: number;
};

export type BrainRetrieveKind = "source" | "note" | "artifact";

export type BrainRetrieveHit = {
  orgId: string;
  kind: BrainRetrieveKind;
  id: string;
  brainId: string;
  growthUnitId: string;
  title: string;
  body: string;
  uri: string;
  sourceUnitId: string | null;
};

export type RetrieveBrain = (query: BrainRetrieveQuery) => Promise<BrainRetrieveHit[]>;

const ORG_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ItemTable = typeof brainSources | typeof brainNotes | typeof brainArtifacts;

const TABLES: Record<BrainRetrieveKind, ItemTable> = {
  source: brainSources,
  note: brainNotes,
  artifact: brainArtifacts,
};

export class BrainRetrieveError extends Error {
  constructor(public code: "org_required") {
    super(code);
    this.name = "BrainRetrieveError";
  }
}

function requireOrgId(orgId: string) {
  const id = typeof orgId === "string" ? orgId.trim() : "";
  if (!ORG_ID.test(id)) throw new BrainRetrieveError("org_required");
  return id;
}

function likePattern(text: string) {
  const trimmed = text.trim().slice(0, 200);
  if (!trimmed) return "";
  const escaped = trimmed.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  return `%${escaped}%`;
}

function whereThisOrg(table: ItemTable, orgId: string, pattern: string): SQL {
  const org = eq(table.orgId, orgId);
  if (!pattern) return org;
  return and(
    org,
    or(ilike(table.title, pattern), ilike(table.body, pattern), ilike(table.uri, pattern)),
  )!;
}

function rank(hit: BrainRetrieveHit, needle: string) {
  const q = needle.toLowerCase();
  const title = hit.title.toLowerCase();
  const body = hit.body.toLowerCase();
  if (title === q) return 0;
  if (title.includes(q)) return 1;
  if (body.includes(q)) return 2;
  return 3;
}

async function readKind(
  orgId: string,
  kind: BrainRetrieveKind,
  pattern: string,
  limit: number,
): Promise<BrainRetrieveHit[]> {
  const table = TABLES[kind];
  const db = getDb();
  const rows = await db
    .select({
      id: table.id,
      orgId: table.orgId,
      brainId: table.brainId,
      growthUnitId: table.growthUnitId,
      title: table.title,
      body: table.body,
      uri: table.uri,
      composerUnitId: table.composerUnitId,
      sortOrder: table.sortOrder,
    })
    .from(table)
    .where(whereThisOrg(table, orgId, pattern))
    .orderBy(asc(table.sortOrder), asc(table.id))
    .limit(limit);

  const hits: BrainRetrieveHit[] = [];
  for (const row of rows) {
    if (row.orgId !== orgId) continue;
    hits.push({
      orgId,
      kind,
      id: row.id,
      brainId: row.brainId,
      growthUnitId: row.growthUnitId,
      title: row.title,
      body: row.body,
      uri: row.uri,
      sourceUnitId: row.composerUnitId,
    });
  }
  return hits;
}

export const retrieveBrain: RetrieveBrain = async (query) => {
  const orgId = requireOrgId(query.orgId);
  const needle = typeof query.text === "string" ? query.text.trim().slice(0, 200) : "";
  if (!needle) return [];
  const pattern = likePattern(needle);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 40);
  const bundles = await Promise.all(
    (Object.keys(TABLES) as BrainRetrieveKind[]).map((kind) =>
      readKind(orgId, kind, pattern, limit),
    ),
  );
  return bundles
    .flat()
    .filter((hit) => hit.orgId === orgId)
    .sort(
      (a, b) =>
        rank(a, needle) - rank(b, needle) ||
        a.kind.localeCompare(b.kind) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
};
