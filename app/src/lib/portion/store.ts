import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  curriculumPathItems,
  curriculumPaths,
  learningEvents,
  learningIntents,
  nextPortionItems,
  nextPortions,
} from "@/lib/db/schema";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { assertChildInHousehold, IntentAccessError } from "@/lib/intent/store";
import { intentHasPlanFields, type IntentFields } from "@/lib/intent/rules";
import {
  type ChildProgress,
  type PathStation,
  type PortionHorizon,
  type PortionItemDraft,
  type PortionStatus,
  asHorizon,
  asReason,
  asTitle,
  parsePortionItems,
  portionHasItems,
} from "./rules";
import {
  horizonFromIntent,
  portionReason,
  portionTitle,
  remainingStations,
  sliceNextPortion,
} from "./suggest";

export class PortionAccessError extends IntentAccessError {
  constructor(status: 403 | 404, code: string) {
    super(status, code);
    this.name = "PortionAccessError";
  }
}

export class PortionFieldsError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "PortionFieldsError";
  }
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function fieldsFromIntent(row: typeof learningIntents.$inferSelect): IntentFields {
  return {
    goals: asList(row.goals),
    subjects: asList(row.subjects),
    themes: asList(row.themes),
    timeHorizon: row.timeHorizon,
    constraints: asList(row.constraints),
    tags: (row.tags ?? {}) as IntentFields["tags"],
  };
}

export function publicItem(row: typeof nextPortionItems.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    portionId: row.portionId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    pathItemId: row.pathItemId,
    sortOrder: row.sortOrder,
    title: row.title,
    subject: row.subject,
    reason: row.reason,
    source: row.source,
    composerLessonId: row.composerLessonId,
    composerUnitId: row.composerUnitId,
    createdAt: row.createdAt.toISOString(),
  };
}

export function publicPortion(
  row: typeof nextPortions.$inferSelect,
  items: Array<typeof nextPortionItems.$inferSelect>,
) {
  return {
    id: row.id,
    orgId: row.orgId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    pathId: row.pathId,
    intentId: row.intentId,
    version: row.version,
    status: row.status,
    horizon: row.horizon,
    title: row.title,
    reason: row.reason,
    remaining: row.remaining ?? {},
    progress: row.progress ?? {},
    supersedesId: row.supersedesId,
    lockedAt: row.lockedAt ? row.lockedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    items: items.map(publicItem),
  };
}

async function loadItems(orgId: string, portionIds: string[]) {
  if (!portionIds.length) return [];
  const db = getDb();
  return db
    .select()
    .from(nextPortionItems)
    .where(and(eq(nextPortionItems.orgId, orgId), inArray(nextPortionItems.portionId, portionIds)))
    .orderBy(asc(nextPortionItems.sortOrder));
}

async function latestIntent(orgId: string, childMembershipId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(learningIntents)
    .where(
      and(eq(learningIntents.orgId, orgId), eq(learningIntents.childMembershipId, childMembershipId)),
    )
    .orderBy(desc(learningIntents.version))
    .limit(1);
  return row ?? null;
}

async function latestPortion(orgId: string, childMembershipId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(nextPortions)
    .where(
      and(eq(nextPortions.orgId, orgId), eq(nextPortions.childMembershipId, childMembershipId)),
    )
    .orderBy(desc(nextPortions.version))
    .limit(1);
  return row ?? null;
}

async function assignedPath(orgId: string, childMembershipId: string) {
  const db = getDb();
  const [row] = await db
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
  if (!row) return null;
  const items = await db
    .select()
    .from(curriculumPathItems)
    .where(and(eq(curriculumPathItems.orgId, orgId), eq(curriculumPathItems.pathId, row.id)))
    .orderBy(asc(curriculumPathItems.sortOrder));
  return { row, items };
}

async function loadProgress(orgId: string, childMembershipId: string): Promise<ChildProgress> {
  const db = getDb();
  const events = await db
    .select()
    .from(learningEvents)
    .where(and(eq(learningEvents.orgId, orgId), eq(learningEvents.membershipId, childMembershipId)))
    .orderBy(desc(learningEvents.createdAt));
  const notes = events
    .filter((event) => event.objectId === "parent-note")
    .map((event) => {
      const raw = event.raw as { notes?: string } | null;
      return typeof raw?.notes === "string" ? raw.notes : "";
    })
    .filter(Boolean);
  const covered = events
    .filter((event) => event.kind === "watch" || event.kind === "quiz")
    .map((event) => event.objectId)
    .filter(Boolean);
  return {
    welcomeWatched: events.some(
      (event) => event.objectId === "home:welcome" && event.kind === "watch",
    ),
    eventCount: events.length,
    notes,
    covered,
  };
}

function stationsFromPath(items: Array<typeof curriculumPathItems.$inferSelect>): PathStation[] {
  return items.map((item) => ({
    id: item.id,
    sortOrder: item.sortOrder,
    title: item.title,
    subject: item.subject,
    reason: item.reason,
    source: item.source,
    composerLessonId: item.composerLessonId,
    composerUnitId: item.composerUnitId,
  }));
}

async function insertPortion(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  pathId: string | null;
  intentId: string | null;
  status: PortionStatus;
  horizon: PortionHorizon;
  title: string;
  reason: string;
  remaining: Record<string, unknown>;
  progress: Record<string, unknown>;
  items: PortionItemDraft[];
}) {
  if (!portionHasItems(opts.items)) throw new PortionFieldsError("items_required");
  const db = getDb();
  const latest = await latestPortion(opts.actor.orgId, opts.childMembershipId);
  const [row] = await db
    .insert(nextPortions)
    .values({
      orgId: opts.actor.orgId,
      parentMembershipId: opts.actor.membershipId,
      childMembershipId: opts.childMembershipId,
      pathId: opts.pathId,
      intentId: opts.intentId,
      version: (latest?.version ?? 0) + 1,
      status: opts.status,
      horizon: opts.horizon,
      title: opts.title,
      reason: opts.reason,
      remaining: opts.remaining,
      progress: opts.progress,
      supersedesId: latest?.id ?? null,
    })
    .returning();
  const inserted = await db
    .insert(nextPortionItems)
    .values(
      opts.items.map((item) => ({
        orgId: opts.actor.orgId,
        portionId: row.id,
        parentMembershipId: opts.actor.membershipId,
        childMembershipId: opts.childMembershipId,
        pathItemId: item.pathItemId,
        sortOrder: item.sortOrder,
        title: item.title,
        subject: item.subject,
        reason: item.reason,
        source: item.source,
        composerLessonId: item.composerLessonId,
        composerUnitId: item.composerUnitId,
      })),
    )
    .returning();
  return publicPortion(row, inserted);
}

export async function listNextPortions(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
}) {
  await assertChildInHousehold(opts);
  const db = getDb();
  const rows = await db
    .select()
    .from(nextPortions)
    .where(
      and(
        eq(nextPortions.orgId, opts.actor.orgId),
        eq(nextPortions.childMembershipId, opts.childMembershipId),
      ),
    )
    .orderBy(desc(nextPortions.version));
  const items = await loadItems(
    opts.actor.orgId,
    rows.map((row) => row.id),
  );
  const byPortion = new Map<string, typeof items>();
  for (const item of items) {
    const list = byPortion.get(item.portionId) ?? [];
    list.push(item);
    byPortion.set(item.portionId, list);
  }
  const versions = rows.map((row) => publicPortion(row, byPortion.get(row.id) ?? []));
  const locked = versions.find((row) => row.status === "locked") ?? null;
  const assigned = await assignedPath(opts.actor.orgId, opts.childMembershipId);
  const progress = await loadProgress(opts.actor.orgId, opts.childMembershipId);
  const remaining = assigned ? remainingStations(stationsFromPath(assigned.items), progress) : [];
  return {
    current: versions[0] ?? null,
    locked,
    remaining: remaining.map((item) => ({
      id: item.id ?? null,
      title: item.title,
      subject: item.subject,
      composerLessonId: item.composerLessonId,
      childMembershipId: opts.childMembershipId,
    })),
    versions,
  };
}

export async function suggestNextPortion(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  body?: Record<string, unknown>;
}) {
  await assertChildInHousehold(opts);
  const assigned = await assignedPath(opts.actor.orgId, opts.childMembershipId);
  if (!assigned) throw new PortionFieldsError("path_required");
  const intentRow = await latestIntent(opts.actor.orgId, opts.childMembershipId);
  if (!intentRow || !intentHasPlanFields(fieldsFromIntent(intentRow))) {
    throw new PortionFieldsError("intent_required");
  }
  const intent = fieldsFromIntent(intentRow);
  const progress = await loadProgress(opts.actor.orgId, opts.childMembershipId);
  const remaining = remainingStations(stationsFromPath(assigned.items), progress);
  if (!remaining.length) throw new PortionFieldsError("remaining_required");
  const horizon = horizonFromIntent(intent, opts.body?.horizon);
  const items = sliceNextPortion({ remaining, horizon, intent });
  if (!portionHasItems(items)) throw new PortionFieldsError("remaining_required");
  const leftover = remaining.filter(
    (station) => !items.some((item) => item.title.toLowerCase() === station.title.toLowerCase()),
  );
  return insertPortion({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    pathId: assigned.row.id,
    intentId: intentRow.id,
    status: "suggested",
    horizon,
    title: portionTitle(horizon, items, intent),
    reason: portionReason({
      horizon,
      remainingCount: remaining.length,
      items,
      intent,
      progress,
    }),
    remaining: {
      count: leftover.length,
      titles: leftover.map((item) => item.title),
    },
    progress: {
      ...progress,
      pathId: assigned.row.id,
      pathVersion: assigned.row.version,
      remainingBefore: remaining.map((item) => item.title),
    },
    items,
  });
}

export async function lockNextPortion(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  portionId?: string;
}) {
  await assertChildInHousehold(opts);
  const db = getDb();
  const current = opts.portionId
    ? (
        await db
          .select()
          .from(nextPortions)
          .where(
            and(
              eq(nextPortions.id, opts.portionId),
              eq(nextPortions.orgId, opts.actor.orgId),
              eq(nextPortions.childMembershipId, opts.childMembershipId),
            ),
          )
          .limit(1)
      )[0]
    : await latestPortion(opts.actor.orgId, opts.childMembershipId);
  if (!current) throw new PortionFieldsError("portion_required");
  const [row] = await db
    .update(nextPortions)
    .set({
      status: "locked",
      lockedAt: current.lockedAt ?? new Date(),
    })
    .where(and(eq(nextPortions.id, current.id), eq(nextPortions.orgId, opts.actor.orgId)))
    .returning();
  const items = await loadItems(opts.actor.orgId, [row.id]);
  return publicPortion(row, items);
}

export async function overrideNextPortion(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  body: Record<string, unknown>;
}) {
  await assertChildInHousehold(opts);
  const items = parsePortionItems(opts.body.items ?? opts.body.portion);
  if (!portionHasItems(items)) throw new PortionFieldsError("items_required");
  const assigned = await assignedPath(opts.actor.orgId, opts.childMembershipId);
  const intentRow = await latestIntent(opts.actor.orgId, opts.childMembershipId);
  const latest = await latestPortion(opts.actor.orgId, opts.childMembershipId);
  const progress = await loadProgress(opts.actor.orgId, opts.childMembershipId);
  const remaining = assigned
    ? remainingStations(stationsFromPath(assigned.items), progress)
    : [];
  const horizon = asHorizon(opts.body.horizon ?? intentRow?.timeHorizon ?? latest?.horizon ?? "week");
  const title =
    asTitle(opts.body.title) ||
    portionTitle(horizon, items, intentRow ? fieldsFromIntent(intentRow) : null);
  const reason = asReason(opts.body.reason) || "Parent override of the next portion";
  return insertPortion({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    pathId: assigned?.row.id ?? latest?.pathId ?? null,
    intentId: intentRow?.id ?? latest?.intentId ?? null,
    status: "overridden",
    horizon,
    title,
    reason,
    remaining: {
      count: remaining.length,
      titles: remaining.map((item) => item.title),
      overriddenFrom: latest?.id ?? null,
    },
    progress: {
      ...progress,
      overriddenFrom: latest?.id ?? null,
    },
    items: items.map((item) => ({ ...item, source: "override" as const })),
  });
}
