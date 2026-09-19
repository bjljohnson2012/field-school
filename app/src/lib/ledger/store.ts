import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  curriculumPathItems,
  curriculumPaths,
  learningEvents,
  learningIntents,
  nextPortionItems,
  nextPortions,
  progressLedgerUnits,
  progressLedgers,
} from "@/lib/db/schema";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { assertChildInHousehold, IntentAccessError } from "@/lib/intent/store";
import {
  assembleLedgerUnits,
  groupLedgerUnits,
  ledgerSummary,
  mergeStations,
} from "./assemble";
import {
  type ChildProgress,
  type LedgerStation,
  type LedgerUnitDraft,
  type LedgerUnitStatus,
  ledgerHasUnits,
  parseLedgerUnitPatch,
} from "./rules";

export class LedgerAccessError extends IntentAccessError {
  constructor(status: 403 | 404, code: string) {
    super(status, code);
    this.name = "LedgerAccessError";
  }
}

export class LedgerFieldsError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "LedgerFieldsError";
  }
}

export function publicUnit(row: typeof progressLedgerUnits.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    ledgerId: row.ledgerId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    pathItemId: row.pathItemId,
    portionItemId: row.portionItemId,
    sortOrder: row.sortOrder,
    title: row.title,
    subject: row.subject,
    status: row.status,
    source: row.source,
    composerLessonId: row.composerLessonId,
    composerUnitId: row.composerUnitId,
    confidence: row.confidence,
    flag: row.flag,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function publicLedger(
  row: typeof progressLedgers.$inferSelect,
  items: Array<typeof progressLedgerUnits.$inferSelect>,
) {
  const units = items.map(publicUnit);
  const grouped = groupLedgerUnits(
    units.map((unit) => ({
      sortOrder: unit.sortOrder,
      title: unit.title,
      subject: unit.subject,
      status: unit.status as LedgerUnitStatus,
      source: unit.source as LedgerUnitDraft["source"],
      pathItemId: unit.pathItemId,
      portionItemId: unit.portionItemId,
      composerLessonId: unit.composerLessonId,
      composerUnitId: unit.composerUnitId,
      confidence: (unit.confidence ?? "") as LedgerUnitDraft["confidence"],
      flag: (unit.flag ?? "") as LedgerUnitDraft["flag"],
      startedAt: unit.startedAt,
      completedAt: unit.completedAt,
    })),
  );
  return {
    id: row.id,
    orgId: row.orgId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    pathId: row.pathId,
    portionId: row.portionId,
    intentId: row.intentId,
    version: row.version,
    status: row.status,
    summary: row.summary ?? ledgerSummary(grouped.completed.concat(grouped.inProgress, grouped.recommended)),
    progress: row.progress ?? {},
    supersedesId: row.supersedesId,
    createdAt: row.createdAt.toISOString(),
    units,
    completed: grouped.completed,
    inProgress: grouped.inProgress,
    recommended: grouped.recommended,
    next: grouped.next,
  };
}

async function loadUnits(orgId: string, ledgerIds: string[]) {
  if (!ledgerIds.length) return [];
  const db = getDb();
  return db
    .select()
    .from(progressLedgerUnits)
    .where(and(eq(progressLedgerUnits.orgId, orgId), inArray(progressLedgerUnits.ledgerId, ledgerIds)))
    .orderBy(asc(progressLedgerUnits.sortOrder));
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

async function latestLedger(orgId: string, childMembershipId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(progressLedgers)
    .where(
      and(eq(progressLedgers.orgId, orgId), eq(progressLedgers.childMembershipId, childMembershipId)),
    )
    .orderBy(desc(progressLedgers.version))
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

async function activePortion(orgId: string, childMembershipId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(nextPortions)
    .where(
      and(eq(nextPortions.orgId, orgId), eq(nextPortions.childMembershipId, childMembershipId)),
    )
    .orderBy(desc(nextPortions.version));
  const locked = rows.find((row) => row.status === "locked") ?? null;
  const current = locked ?? rows[0] ?? null;
  if (!current) return null;
  const items = await db
    .select()
    .from(nextPortionItems)
    .where(and(eq(nextPortionItems.orgId, orgId), eq(nextPortionItems.portionId, current.id)))
    .orderBy(asc(nextPortionItems.sortOrder));
  return { row: current, items };
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
    .filter((event) => {
      const raw = (event.raw ?? {}) as { status?: string };
      if (event.kind === "quiz") return true;
      if (event.kind !== "watch") return false;
      return raw.status !== "in_progress";
    })
    .map((event) => event.objectId)
    .filter(Boolean);
  const started = events
    .filter((event) => {
      const raw = (event.raw ?? {}) as { status?: string };
      return event.kind === "watch" && raw.status === "in_progress";
    })
    .map((event) => event.objectId)
    .filter(Boolean);
  return {
    welcomeWatched: events.some(
      (event) => event.objectId === "home:welcome" && event.kind === "watch",
    ),
    eventCount: events.length,
    notes,
    covered,
    started,
  };
}

function stationsFromPath(items: Array<typeof curriculumPathItems.$inferSelect>): LedgerStation[] {
  return items.map((item) => ({
    id: item.id,
    pathItemId: item.id,
    sortOrder: item.sortOrder,
    title: item.title,
    subject: item.subject,
    composerLessonId: item.composerLessonId,
    composerUnitId: item.composerUnitId,
  }));
}

function stationsFromPortion(items: Array<typeof nextPortionItems.$inferSelect>): LedgerStation[] {
  return items.map((item) => ({
    id: item.id,
    pathItemId: item.pathItemId,
    portionItemId: item.id,
    sortOrder: item.sortOrder,
    title: item.title,
    subject: item.subject,
    composerLessonId: item.composerLessonId,
    composerUnitId: item.composerUnitId,
    onPortion: true,
  }));
}

async function insertLedger(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  pathId: string | null;
  portionId: string | null;
  intentId: string | null;
  progress: Record<string, unknown>;
  items: LedgerUnitDraft[];
}) {
  if (!ledgerHasUnits(opts.items)) throw new LedgerFieldsError("units_required");
  const db = getDb();
  const latest = await latestLedger(opts.actor.orgId, opts.childMembershipId);
  const [row] = await db
    .insert(progressLedgers)
    .values({
      orgId: opts.actor.orgId,
      parentMembershipId: opts.actor.membershipId,
      childMembershipId: opts.childMembershipId,
      pathId: opts.pathId,
      portionId: opts.portionId,
      intentId: opts.intentId,
      version: (latest?.version ?? 0) + 1,
      status: "current",
      summary: ledgerSummary(opts.items),
      progress: opts.progress,
      supersedesId: latest?.id ?? null,
    })
    .returning();
  const inserted = await db
    .insert(progressLedgerUnits)
    .values(
      opts.items.map((item) => ({
        orgId: opts.actor.orgId,
        ledgerId: row.id,
        parentMembershipId: opts.actor.membershipId,
        childMembershipId: opts.childMembershipId,
        pathItemId: item.pathItemId,
        portionItemId: item.portionItemId,
        sortOrder: item.sortOrder,
        title: item.title,
        subject: item.subject,
        status: item.status,
        source: item.source,
        composerLessonId: item.composerLessonId,
        composerUnitId: item.composerUnitId,
        confidence: item.confidence ?? "",
        flag: item.flag ?? "",
        startedAt: item.startedAt ? new Date(item.startedAt) : null,
        completedAt: item.completedAt ? new Date(item.completedAt) : null,
      })),
    )
    .returning();
  return publicLedger(row, inserted);
}

async function assembleForChild(orgId: string, childMembershipId: string) {
  const assigned = await assignedPath(orgId, childMembershipId);
  const portion = await activePortion(orgId, childMembershipId);
  const intentRow = await latestIntent(orgId, childMembershipId);
  const progress = await loadProgress(orgId, childMembershipId);
  const latest = await latestLedger(orgId, childMembershipId);
  const persisted = latest
    ? (await loadUnits(orgId, [latest.id])).map((row) => ({
        title: row.title,
        status: row.status as LedgerUnitStatus,
        confidence: row.confidence as LedgerUnitDraft["confidence"],
        flag: row.flag as LedgerUnitDraft["flag"],
        startedAt: row.startedAt ? row.startedAt.toISOString() : null,
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      }))
    : [];
  const extra: LedgerStation[] = progress.covered
    .filter((title) => title && title !== "home:welcome" && title !== "parent-note")
    .map((title) => ({
      title,
      subject: "",
      composerLessonId: null,
      composerUnitId: null,
    }));
  const stations = mergeStations({
    path: assigned ? stationsFromPath(assigned.items) : [],
    portion: portion ? stationsFromPortion(portion.items) : [],
    extra,
  });
  const items = assembleLedgerUnits({ stations, progress, persisted });
  return {
    assigned,
    portion,
    intentRow,
    progress,
    items,
  };
}

export async function listProgressLedgers(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
}) {
  await assertChildInHousehold(opts);
  const db = getDb();
  const rows = await db
    .select()
    .from(progressLedgers)
    .where(
      and(
        eq(progressLedgers.orgId, opts.actor.orgId),
        eq(progressLedgers.childMembershipId, opts.childMembershipId),
      ),
    )
    .orderBy(desc(progressLedgers.version));
  const items = await loadUnits(
    opts.actor.orgId,
    rows.map((row) => row.id),
  );
  const byLedger = new Map<string, typeof items>();
  for (const item of items) {
    const list = byLedger.get(item.ledgerId) ?? [];
    list.push(item);
    byLedger.set(item.ledgerId, list);
  }
  const versions = rows.map((row) => publicLedger(row, byLedger.get(row.id) ?? []));
  const assembled = await assembleForChild(opts.actor.orgId, opts.childMembershipId);
  const live = groupLedgerUnits(assembled.items);
  const current = versions[0] ?? null;
  return {
    current,
    completed: current?.completed ?? live.completed,
    inProgress: current?.inProgress ?? live.inProgress,
    recommended: current?.recommended ?? live.recommended,
    next: current?.next ?? live.next,
    versions,
  };
}

export async function refreshProgressLedger(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
}) {
  await assertChildInHousehold(opts);
  const assembled = await assembleForChild(opts.actor.orgId, opts.childMembershipId);
  if (!ledgerHasUnits(assembled.items)) throw new LedgerFieldsError("units_required");
  return insertLedger({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    pathId: assembled.assigned?.row.id ?? null,
    portionId: assembled.portion?.row.id ?? null,
    intentId: assembled.intentRow?.id ?? null,
    progress: {
      ...assembled.progress,
      pathId: assembled.assigned?.row.id ?? null,
      pathVersion: assembled.assigned?.row.version ?? null,
      portionId: assembled.portion?.row.id ?? null,
    },
    items: assembled.items,
  });
}

async function writeSupervisedEvent(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  title: string;
  kind: "watch" | "assignment";
  composerLessonId: string | null;
  raw: Record<string, unknown>;
}) {
  const db = getDb();
  await db.insert(learningEvents).values({
    orgId: opts.actor.orgId,
    membershipId: opts.childMembershipId,
    actorMembershipId: opts.actor.membershipId,
    actorStance: opts.actor.stance,
    kind: opts.kind,
    objectType: "unit",
    objectId: opts.title,
    raw: {
      supervised: true,
      recordedBy: "parent",
      composerLessonId: opts.composerLessonId,
      childMembershipId: opts.childMembershipId,
      ...opts.raw,
    },
  });
}

export async function markLedgerUnit(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  action: "start" | "complete" | "confidence";
  body: Record<string, unknown>;
}) {
  await assertChildInHousehold(opts);
  const patch = parseLedgerUnitPatch(opts.body);
  if (!patch.title) throw new LedgerFieldsError("title_required");
  if (opts.action === "confidence" && !patch.confidence && !patch.flag) {
    throw new LedgerFieldsError("confidence_required");
  }
  const now = new Date().toISOString();
  const assembled = await assembleForChild(opts.actor.orgId, opts.childMembershipId);
  const existing = assembled.items.find(
    (item) => item.title.toLowerCase() === patch.title.toLowerCase(),
  );
  const nextStatus: LedgerUnitStatus =
    opts.action === "complete"
      ? "completed"
      : opts.action === "start"
        ? "in_progress"
        : (existing?.status ?? "recommended");
  const unit: LedgerUnitDraft = existing
    ? {
        ...existing,
        status: nextStatus,
        source: "parent",
        confidence: opts.action === "confidence" ? patch.confidence || existing.confidence : existing.confidence,
        flag: opts.action === "confidence" ? patch.flag || existing.flag : existing.flag,
        startedAt: existing.startedAt ?? (opts.action === "start" ? now : existing.startedAt),
        completedAt: opts.action === "complete" ? now : existing.completedAt ?? null,
      }
    : {
        sortOrder: assembled.items.length + 1,
        title: patch.title,
        subject: patch.subject,
        status: nextStatus,
        source: "parent",
        pathItemId: patch.pathItemId,
        portionItemId: patch.portionItemId,
        composerLessonId: patch.composerLessonId,
        composerUnitId: patch.composerUnitId,
        confidence: patch.confidence,
        flag: patch.flag,
        startedAt: opts.action === "start" || opts.action === "complete" ? now : null,
        completedAt: opts.action === "complete" ? now : null,
      };
  const items = existing
    ? assembled.items.map((item) =>
        item.title.toLowerCase() === patch.title.toLowerCase() ? unit : item,
      )
    : [...assembled.items, unit];
  await writeSupervisedEvent({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    title: unit.title,
    kind: opts.action === "confidence" ? "assignment" : "watch",
    composerLessonId: unit.composerLessonId,
    raw:
      opts.action === "confidence"
        ? { confidence: unit.confidence, flag: unit.flag }
        : { status: nextStatus === "completed" ? "completed" : "in_progress" },
  });
  return insertLedger({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    pathId: assembled.assigned?.row.id ?? null,
    portionId: assembled.portion?.row.id ?? null,
    intentId: assembled.intentRow?.id ?? null,
    progress: {
      ...assembled.progress,
      marked: unit.title,
      action: opts.action,
    },
    items,
  });
}
