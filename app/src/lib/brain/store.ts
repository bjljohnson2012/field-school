import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  brainArtifacts,
  brainNotes,
  brainSources,
  curriculumPaths,
  growthUnits,
  knowledgeBrains,
  learningIntents,
  members,
  memberships,
  nextPortions,
  progressLedgers,
  wards,
} from "@/lib/db/schema";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { assertChildInHousehold, IntentAccessError } from "@/lib/intent/store";
import {
  type BrainItemDraft,
  type BrainSnapshot,
  type FamilyFirstKind,
  asSnapshotBag,
  asTitle,
  brainSummary,
  isFamilyFirstKind,
  parseBrainItems,
  snapshotHasKeys,
} from "./rules";

export class BrainAccessError extends IntentAccessError {
  constructor(status: 403 | 404, code: string) {
    super(status, code);
    this.name = "BrainAccessError";
  }
}

export class BrainFieldsError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "BrainFieldsError";
  }
}

type ItemRow =
  | typeof brainSources.$inferSelect
  | typeof brainNotes.$inferSelect
  | typeof brainArtifacts.$inferSelect;

export function publicItem(kind: "source" | "note" | "artifact", row: ItemRow) {
  return {
    id: row.id,
    kind,
    orgId: row.orgId,
    growthUnitId: row.growthUnitId,
    brainId: row.brainId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    sortOrder: row.sortOrder,
    title: row.title,
    body: row.body,
    uri: row.uri,
    composerSourceId: row.composerSourceId,
    composerUnitId: row.composerUnitId,
    createdAt: row.createdAt.toISOString(),
  };
}

export function publicUnit(row: typeof growthUnits.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    kind: row.kind,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function publicBrain(
  row: typeof knowledgeBrains.$inferSelect,
  items: {
    sources: Array<typeof brainSources.$inferSelect>;
    notes: Array<typeof brainNotes.$inferSelect>;
    artifacts: Array<typeof brainArtifacts.$inferSelect>;
  },
) {
  const sources = items.sources.map((item) => publicItem("source", item));
  const notes = items.notes.map((item) => publicItem("note", item));
  const artifacts = items.artifacts.map((item) => publicItem("artifact", item));
  return {
    id: row.id,
    orgId: row.orgId,
    growthUnitId: row.growthUnitId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    version: row.version,
    status: row.status,
    intent: row.intent ?? {},
    paths: row.paths ?? {},
    progress: row.progress ?? {},
    summary: row.summary ?? brainSummary({ sources: sources.length, notes: notes.length, artifacts: artifacts.length }),
    supersedesId: row.supersedesId,
    createdAt: row.createdAt.toISOString(),
    sources,
    notes,
    artifacts,
  };
}

async function loadItems(orgId: string, brainIds: string[]) {
  if (!brainIds.length) {
    return { sources: [], notes: [], artifacts: [] };
  }
  const db = getDb();
  const [sources, notes, artifacts] = await Promise.all([
    db
      .select()
      .from(brainSources)
      .where(and(eq(brainSources.orgId, orgId), inArray(brainSources.brainId, brainIds)))
      .orderBy(asc(brainSources.sortOrder)),
    db
      .select()
      .from(brainNotes)
      .where(and(eq(brainNotes.orgId, orgId), inArray(brainNotes.brainId, brainIds)))
      .orderBy(asc(brainNotes.sortOrder)),
    db
      .select()
      .from(brainArtifacts)
      .where(and(eq(brainArtifacts.orgId, orgId), inArray(brainArtifacts.brainId, brainIds)))
      .orderBy(asc(brainArtifacts.sortOrder)),
  ]);
  return { sources, notes, artifacts };
}

function itemsForBrain(
  brainId: string,
  bundle: Awaited<ReturnType<typeof loadItems>>,
) {
  return {
    sources: bundle.sources.filter((row) => row.brainId === brainId),
    notes: bundle.notes.filter((row) => row.brainId === brainId),
    artifacts: bundle.artifacts.filter((row) => row.brainId === brainId),
  };
}

async function latestBrain(orgId: string, growthUnitId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(knowledgeBrains)
    .where(and(eq(knowledgeBrains.orgId, orgId), eq(knowledgeBrains.growthUnitId, growthUnitId)))
    .orderBy(desc(knowledgeBrains.version))
    .limit(1);
  return row ?? null;
}

async function childTitle(childMembershipId: string) {
  const db = getDb();
  const [row] = await db
    .select({ name: members.name })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(eq(memberships.id, childMembershipId))
    .limit(1);
  return row?.name?.trim() || "Child";
}

async function snapshotFromFamilyStores(orgId: string, childMembershipId: string) {
  const db = getDb();
  const [intent] = await db
    .select()
    .from(learningIntents)
    .where(and(eq(learningIntents.orgId, orgId), eq(learningIntents.childMembershipId, childMembershipId)))
    .orderBy(desc(learningIntents.version))
    .limit(1);
  const [path] = await db
    .select()
    .from(curriculumPaths)
    .where(
      and(
        eq(curriculumPaths.orgId, orgId),
        eq(curriculumPaths.childMembershipId, childMembershipId),
        eq(curriculumPaths.status, "accepted"),
      ),
    )
    .orderBy(desc(curriculumPaths.version))
    .limit(1);
  const portions = await db
    .select()
    .from(nextPortions)
    .where(and(eq(nextPortions.orgId, orgId), eq(nextPortions.childMembershipId, childMembershipId)))
    .orderBy(desc(nextPortions.version));
  const portion = portions.find((row) => row.status === "locked") ?? portions[0] ?? null;
  const [ledger] = await db
    .select()
    .from(progressLedgers)
    .where(and(eq(progressLedgers.orgId, orgId), eq(progressLedgers.childMembershipId, childMembershipId)))
    .orderBy(desc(progressLedgers.version))
    .limit(1);
  return {
    intent: intent
      ? {
          id: intent.id,
          goals: intent.goals,
          subjects: intent.subjects,
          themes: intent.themes,
          timeHorizon: intent.timeHorizon,
          constraints: intent.constraints,
          tags: intent.tags,
        }
      : {},
    paths: {
      ...(path ? { pathId: path.id } : {}),
      ...(portion ? { portionId: portion.id } : {}),
    },
    progress: ledger
      ? {
          ledgerId: ledger.id,
          ...(ledger.summary && typeof ledger.summary === "object" ? ledger.summary : {}),
        }
      : {},
  };
}

async function findChildUnit(orgId: string, childMembershipId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(growthUnits)
    .where(
      and(
        eq(growthUnits.orgId, orgId),
        eq(growthUnits.kind, "child"),
        eq(growthUnits.childMembershipId, childMembershipId),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function findFamilyUnit(orgId: string, parentMembershipId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(growthUnits)
    .where(
      and(
        eq(growthUnits.orgId, orgId),
        eq(growthUnits.kind, "family"),
        eq(growthUnits.parentMembershipId, parentMembershipId),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function assertUnitAccess(
  opts: { actor: LearnerIdentity; staff: boolean },
  unit: typeof growthUnits.$inferSelect,
) {
  if (unit.orgId !== opts.actor.orgId) throw new BrainAccessError(403, "not_your_child");
  if (!isFamilyFirstKind(unit.kind)) throw new BrainAccessError(403, "family_mode_only");
  if (unit.kind === "child") {
    if (!unit.childMembershipId) throw new BrainAccessError(403, "not_your_child");
    await assertChildInHousehold({
      actor: opts.actor,
      childMembershipId: unit.childMembershipId,
      staff: opts.staff,
    });
    return;
  }
  if (!opts.staff && unit.parentMembershipId !== opts.actor.membershipId) {
    throw new BrainAccessError(403, "not_your_child");
  }
}

async function loadUnitById(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  growthUnitId: string;
}) {
  const db = getDb();
  const [unit] = await db
    .select()
    .from(growthUnits)
    .where(and(eq(growthUnits.orgId, opts.actor.orgId), eq(growthUnits.id, opts.growthUnitId)))
    .limit(1);
  if (!unit) throw new BrainAccessError(404, "growth_unit_id_required");
  await assertUnitAccess(opts, unit);
  return unit;
}

async function wardChildIds(opts: { actor: LearnerIdentity; staff: boolean }) {
  const db = getDb();
  if (opts.staff) {
    const rows = await db
      .select({ childMembershipId: growthUnits.childMembershipId })
      .from(growthUnits)
      .where(and(eq(growthUnits.orgId, opts.actor.orgId), eq(growthUnits.kind, "child")));
    return rows
      .map((row) => row.childMembershipId)
      .filter((id): id is string => Boolean(id));
  }
  const rows = await db
    .select({ childMembershipId: wards.childMembershipId })
    .from(wards)
    .where(
      and(eq(wards.orgId, opts.actor.orgId), eq(wards.guardianMembershipId, opts.actor.membershipId)),
    );
  return rows.map((row) => row.childMembershipId);
}

async function listedUnits(opts: { actor: LearnerIdentity; staff: boolean }) {
  const db = getDb();
  const family = await findFamilyUnit(opts.actor.orgId, opts.actor.membershipId);
  const childIds = await wardChildIds(opts);
  const children = childIds.length
    ? await db
        .select()
        .from(growthUnits)
        .where(
          and(
            eq(growthUnits.orgId, opts.actor.orgId),
            eq(growthUnits.kind, "child"),
            inArray(growthUnits.childMembershipId, childIds),
          ),
        )
    : [];
  return [...(family ? [family] : []), ...children];
}

async function versionsForUnit(
  opts: { actor: LearnerIdentity; staff: boolean },
  unit: typeof growthUnits.$inferSelect,
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(knowledgeBrains)
    .where(and(eq(knowledgeBrains.orgId, opts.actor.orgId), eq(knowledgeBrains.growthUnitId, unit.id)))
    .orderBy(desc(knowledgeBrains.version));
  const items = await loadItems(
    opts.actor.orgId,
    rows.map((row) => row.id),
  );
  const versions = rows.map((row) => publicBrain(row, itemsForBrain(row.id, items)));
  return {
    unit: publicUnit(unit),
    current: versions[0] ?? null,
    versions,
  };
}

export async function listKnowledgeBrains(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  growthUnitId?: string;
  childMembershipId?: string;
  kind?: string;
}) {
  if (opts.growthUnitId) {
    const unit = await loadUnitById({
      actor: opts.actor,
      staff: opts.staff,
      growthUnitId: opts.growthUnitId,
    });
    return versionsForUnit(opts, unit);
  }
  if (opts.kind === "family") {
    const unit = await findFamilyUnit(opts.actor.orgId, opts.actor.membershipId);
    if (!unit) return { unit: null, current: null, versions: [] };
    await assertUnitAccess(opts, unit);
    return versionsForUnit(opts, unit);
  }
  if (opts.childMembershipId) {
    await assertChildInHousehold({
      actor: opts.actor,
      childMembershipId: opts.childMembershipId,
      staff: opts.staff,
    });
    const unit = await findChildUnit(opts.actor.orgId, opts.childMembershipId);
    if (!unit) return { unit: null, current: null, versions: [] };
    return versionsForUnit(opts, unit);
  }
  const units = await listedUnits(opts);
  const currents = [];
  for (const unit of units) {
    const latest = await latestBrain(opts.actor.orgId, unit.id);
    const items = latest
      ? await loadItems(opts.actor.orgId, [latest.id])
      : { sources: [], notes: [], artifacts: [] };
    currents.push({
      unit: publicUnit(unit),
      current: latest ? publicBrain(latest, itemsForBrain(latest.id, items)) : null,
    });
  }
  return { units: currents };
}

async function ensureUnit(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  kind: FamilyFirstKind;
  childMembershipId?: string;
  title?: string;
}) {
  const db = getDb();
  if (opts.kind === "child") {
    if (!opts.childMembershipId) throw new BrainFieldsError("child_membership_id_required");
    await assertChildInHousehold({
      actor: opts.actor,
      childMembershipId: opts.childMembershipId,
      staff: opts.staff,
    });
    const existing = await findChildUnit(opts.actor.orgId, opts.childMembershipId);
    const title = asTitle(opts.title) || existing?.title || (await childTitle(opts.childMembershipId));
    if (existing) {
      if (asTitle(opts.title) && existing.title !== title) {
        const [updated] = await db
          .update(growthUnits)
          .set({ title })
          .where(eq(growthUnits.id, existing.id))
          .returning();
        return updated ?? existing;
      }
      return existing;
    }
    const [created] = await db
      .insert(growthUnits)
      .values({
        orgId: opts.actor.orgId,
        parentMembershipId: opts.actor.membershipId,
        childMembershipId: opts.childMembershipId,
        kind: "child",
        title,
        status: "current",
      })
      .returning();
    if (!created) throw new BrainFieldsError("invalid_kind");
    return created;
  }
  const existing = await findFamilyUnit(opts.actor.orgId, opts.actor.membershipId);
  const title = asTitle(opts.title) || existing?.title || "Family";
  if (existing) {
    if (asTitle(opts.title) && existing.title !== title) {
      const [updated] = await db
        .update(growthUnits)
        .set({ title })
        .where(eq(growthUnits.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }
  const [created] = await db
    .insert(growthUnits)
    .values({
      orgId: opts.actor.orgId,
      parentMembershipId: opts.actor.membershipId,
      childMembershipId: null,
      kind: "family",
      title,
      status: "current",
    })
    .returning();
  if (!created) throw new BrainFieldsError("invalid_kind");
  return created;
}

function draftsFromRows(rows: ItemRow[]): BrainItemDraft[] {
  return rows.map((row, index) => ({
    sortOrder: index + 1,
    title: row.title,
    body: row.body,
    uri: row.uri,
    composerSourceId: row.composerSourceId,
    composerUnitId: row.composerUnitId,
  }));
}

function mergeItems(previous: BrainItemDraft[], incoming: BrainItemDraft[] | null) {
  const next = incoming ? previous.concat(incoming) : previous;
  return next.slice(0, 128).map((item, index) => ({ ...item, sortOrder: index + 1 }));
}

async function insertItems(
  table: typeof brainSources | typeof brainNotes | typeof brainArtifacts,
  opts: {
    orgId: string;
    growthUnitId: string;
    brainId: string;
    parentMembershipId: string;
    childMembershipId: string | null;
    items: BrainItemDraft[];
  },
) {
  if (!opts.items.length) return;
  const db = getDb();
  await db.insert(table).values(
    opts.items.map((item) => ({
      orgId: opts.orgId,
      growthUnitId: opts.growthUnitId,
      brainId: opts.brainId,
      parentMembershipId: opts.parentMembershipId,
      childMembershipId: opts.childMembershipId,
      sortOrder: item.sortOrder,
      title: item.title,
      body: item.body,
      uri: item.uri,
      composerSourceId: item.composerSourceId,
      composerUnitId: item.composerUnitId,
    })),
  );
}

export async function writeKnowledgeBrain(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  body: Record<string, unknown>;
}) {
  const growthUnitId =
    (typeof opts.body.growthUnitId === "string" && opts.body.growthUnitId.trim()) ||
    (typeof opts.body.growth_unit_id === "string" && opts.body.growth_unit_id.trim()) ||
    "";
  const childMembershipId =
    (typeof opts.body.childMembershipId === "string" && opts.body.childMembershipId.trim()) ||
    (typeof opts.body.child_membership_id === "string" && opts.body.child_membership_id.trim()) ||
    "";
  let unit: typeof growthUnits.$inferSelect;
  if (growthUnitId) {
    unit = await loadUnitById({
      actor: opts.actor,
      staff: opts.staff,
      growthUnitId,
    });
    if (asTitle(opts.body.title)) {
      const db = getDb();
      const [updated] = await db
        .update(growthUnits)
        .set({ title: asTitle(opts.body.title) })
        .where(eq(growthUnits.id, unit.id))
        .returning();
      unit = updated ?? unit;
    }
  } else {
    const rawKind =
      typeof opts.body.kind === "string" ? opts.body.kind.trim() : childMembershipId ? "child" : "family";
    if (rawKind === "person" || rawKind === "team" || rawKind === "org") {
      throw new BrainAccessError(403, "family_mode_only");
    }
    if (!isFamilyFirstKind(rawKind)) throw new BrainFieldsError("invalid_kind");
    unit = await ensureUnit({
      actor: opts.actor,
      staff: opts.staff,
      kind: rawKind,
      childMembershipId: childMembershipId || undefined,
      title: asTitle(opts.body.title),
    });
  }

  const previous = await latestBrain(opts.actor.orgId, unit.id);
  const previousItems = previous
    ? await loadItems(opts.actor.orgId, [previous.id])
    : { sources: [], notes: [], artifacts: [] };
  const sources = mergeItems(
    draftsFromRows(previousItems.sources),
    "sources" in opts.body ? parseBrainItems(opts.body.sources) : null,
  );
  const notes = mergeItems(
    draftsFromRows(previousItems.notes),
    "notes" in opts.body ? parseBrainItems(opts.body.notes) : null,
  );
  const artifacts = mergeItems(
    draftsFromRows(previousItems.artifacts),
    "artifacts" in opts.body ? parseBrainItems(opts.body.artifacts) : null,
  );

  let intent: BrainSnapshot = "intent" in opts.body ? asSnapshotBag(opts.body.intent) : {};
  let paths: BrainSnapshot = "paths" in opts.body ? asSnapshotBag(opts.body.paths) : {};
  let progress: BrainSnapshot = "progress" in opts.body ? asSnapshotBag(opts.body.progress) : {};
  if (
    unit.kind === "child" &&
    unit.childMembershipId &&
    !snapshotHasKeys(intent) &&
    !snapshotHasKeys(paths) &&
    !snapshotHasKeys(progress)
  ) {
    const snap = await snapshotFromFamilyStores(opts.actor.orgId, unit.childMembershipId);
    intent = previous && snapshotHasKeys(asSnapshotBag(previous.intent))
      ? asSnapshotBag(previous.intent)
      : snap.intent;
    paths = previous && snapshotHasKeys(asSnapshotBag(previous.paths))
      ? asSnapshotBag(previous.paths)
      : snap.paths;
    progress = previous && snapshotHasKeys(asSnapshotBag(previous.progress))
      ? asSnapshotBag(previous.progress)
      : snap.progress;
  } else if (previous) {
    if (!snapshotHasKeys(intent)) intent = asSnapshotBag(previous.intent);
    if (!snapshotHasKeys(paths)) paths = asSnapshotBag(previous.paths);
    if (!snapshotHasKeys(progress)) progress = asSnapshotBag(previous.progress);
  }

  const db = getDb();
  const [row] = await db
    .insert(knowledgeBrains)
    .values({
      orgId: opts.actor.orgId,
      growthUnitId: unit.id,
      parentMembershipId: opts.actor.membershipId,
      childMembershipId: unit.childMembershipId,
      version: (previous?.version ?? 0) + 1,
      status: "current",
      intent,
      paths,
      progress,
      summary: brainSummary({
        sources: sources.length,
        notes: notes.length,
        artifacts: artifacts.length,
      }),
      supersedesId: previous?.id ?? null,
    })
    .returning();
  if (!row) throw new BrainFieldsError("invalid_json");
  const bind = {
    orgId: opts.actor.orgId,
    growthUnitId: unit.id,
    brainId: row.id,
    parentMembershipId: opts.actor.membershipId,
    childMembershipId: unit.childMembershipId,
  };
  await insertItems(brainSources, { ...bind, items: sources });
  await insertItems(brainNotes, { ...bind, items: notes });
  await insertItems(brainArtifacts, { ...bind, items: artifacts });
  const items = await loadItems(opts.actor.orgId, [row.id]);
  return {
    unit: publicUnit(unit),
    current: publicBrain(row, itemsForBrain(row.id, items)),
  };
}

export async function exportKnowledgeBrain(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  growthUnitId: string;
}) {
  const listed = await listKnowledgeBrains(opts);
  if (!("unit" in listed) || !listed.unit || !listed.current) {
    throw new BrainAccessError(404, "growth_unit_id_required");
  }
  return {
    unit: listed.unit,
    current: listed.current,
    sources: listed.current.sources,
    notes: listed.current.notes,
    artifacts: listed.current.artifacts,
  };
}

export async function deleteKnowledgeBrain(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  growthUnitId: string;
}) {
  const unit = await loadUnitById(opts);
  const db = getDb();
  await db.delete(growthUnits).where(eq(growthUnits.id, unit.id));
  return { deleted: true, growthUnitId: unit.id, childMembershipId: unit.childMembershipId };
}
