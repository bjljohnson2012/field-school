import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  curriculumPathItems,
  curriculumPaths,
  learningEvents,
  learningIntents,
} from "@/lib/db/schema";
import { courses, knowledgeUnits, lessons } from "@/lib/composer/schema";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { assertChildInHousehold, IntentAccessError } from "@/lib/intent/store";
import { intentHasPlanFields, type IntentFields } from "@/lib/intent/rules";
import { assemblePathItems } from "./assemble";
import {
  type CatalogLesson,
  type ChildProgress,
  type PathItemDraft,
  type PathStatus,
  intentSnapshot,
  parsePathItems,
  pathHasItems,
} from "./rules";

export class CurriculumAccessError extends IntentAccessError {
  constructor(status: 403 | 404, code: string) {
    super(status, code);
    this.name = "CurriculumAccessError";
  }
}

export class CurriculumFieldsError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "CurriculumFieldsError";
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

export function publicItem(row: typeof curriculumPathItems.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    pathId: row.pathId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    sortOrder: row.sortOrder,
    title: row.title,
    subject: row.subject,
    kind: row.kind,
    reason: row.reason,
    source: row.source,
    composerLessonId: row.composerLessonId,
    composerUnitId: row.composerUnitId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function publicPath(
  row: typeof curriculumPaths.$inferSelect,
  items: Array<typeof curriculumPathItems.$inferSelect>,
) {
  return {
    id: row.id,
    orgId: row.orgId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    intentId: row.intentId,
    version: row.version,
    status: row.status,
    prompt: row.prompt,
    progress: row.progress ?? {},
    supersedesId: row.supersedesId,
    acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    items: items.map(publicItem),
  };
}

async function loadItems(orgId: string, pathIds: string[]) {
  if (!pathIds.length) return [];
  const db = getDb();
  return db
    .select()
    .from(curriculumPathItems)
    .where(and(eq(curriculumPathItems.orgId, orgId), inArray(curriculumPathItems.pathId, pathIds)))
    .orderBy(asc(curriculumPathItems.sortOrder));
}

export async function listCurriculumPaths(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
}) {
  await assertChildInHousehold(opts);
  const db = getDb();
  const rows = await db
    .select()
    .from(curriculumPaths)
    .where(
      and(
        eq(curriculumPaths.orgId, opts.actor.orgId),
        eq(curriculumPaths.childMembershipId, opts.childMembershipId),
      ),
    )
    .orderBy(desc(curriculumPaths.version));
  const items = await loadItems(
    opts.actor.orgId,
    rows.map((row) => row.id),
  );
  const byPath = new Map<string, typeof items>();
  for (const item of items) {
    const list = byPath.get(item.pathId) ?? [];
    list.push(item);
    byPath.set(item.pathId, list);
  }
  const versions = rows.map((row) => publicPath(row, byPath.get(row.id) ?? []));
  const assigned = versions.find((row) => row.status === "accepted") ?? null;
  return {
    current: versions[0] ?? null,
    assigned,
    versions,
  };
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

async function latestPath(orgId: string, childMembershipId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(curriculumPaths)
    .where(
      and(eq(curriculumPaths.orgId, orgId), eq(curriculumPaths.childMembershipId, childMembershipId)),
    )
    .orderBy(desc(curriculumPaths.version))
    .limit(1);
  return row ?? null;
}

async function loadProgress(
  orgId: string,
  childMembershipId: string,
): Promise<ChildProgress> {
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
  const listed = await db
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
  const prior = listed[0]
    ? (await loadItems(orgId, [listed[0].id])).map((item) => item.title)
    : [];
  return {
    welcomeWatched: events.some(
      (event) => event.objectId === "home:welcome" && event.kind === "watch",
    ),
    eventCount: events.length,
    notes,
    covered,
    priorTitles: prior,
  };
}

async function loadCatalog(orgId: string): Promise<CatalogLesson[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        status: lessons.status,
        courseTitle: courses.title,
      })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .where(and(eq(lessons.orgId, orgId), eq(lessons.status, "published")));
    const units = await db
      .select({
        id: knowledgeUnits.id,
        lessonId: knowledgeUnits.lessonId,
        title: knowledgeUnits.title,
      })
      .from(knowledgeUnits)
      .where(eq(knowledgeUnits.orgId, orgId));
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      courseTitle: row.courseTitle,
      status: row.status,
      units: units
        .filter((unit) => unit.lessonId === row.id)
        .map((unit) => ({ id: unit.id, title: unit.title })),
    }));
  } catch {
    return [];
  }
}

async function insertPath(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  intentId: string | null;
  status: PathStatus;
  prompt: string;
  progress: Record<string, unknown>;
  items: PathItemDraft[];
}) {
  if (!pathHasItems(opts.items)) throw new CurriculumFieldsError("items_required");
  const db = getDb();
  const latest = await latestPath(opts.actor.orgId, opts.childMembershipId);
  const [row] = await db
    .insert(curriculumPaths)
    .values({
      orgId: opts.actor.orgId,
      parentMembershipId: opts.actor.membershipId,
      childMembershipId: opts.childMembershipId,
      intentId: opts.intentId,
      version: (latest?.version ?? 0) + 1,
      status: opts.status,
      prompt: opts.prompt,
      progress: opts.progress,
      supersedesId: latest?.id ?? null,
    })
    .returning();
  const inserted = await db
    .insert(curriculumPathItems)
    .values(
      opts.items.map((item) => ({
        orgId: opts.actor.orgId,
        pathId: row.id,
        parentMembershipId: opts.actor.membershipId,
        childMembershipId: opts.childMembershipId,
        sortOrder: item.sortOrder,
        title: item.title,
        subject: item.subject,
        kind: item.kind,
        reason: item.reason,
        source: item.source,
        composerLessonId: item.composerLessonId,
        composerUnitId: item.composerUnitId,
        status: "pending",
      })),
    )
    .returning();
  return publicPath(row, inserted);
}

export async function proposeCurriculumPath(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  prompt?: string;
}) {
  await assertChildInHousehold(opts);
  const intentRow = await latestIntent(opts.actor.orgId, opts.childMembershipId);
  if (!intentRow || !intentHasPlanFields(fieldsFromIntent(intentRow))) {
    throw new CurriculumFieldsError("intent_required");
  }
  const intent = fieldsFromIntent(intentRow);
  const progress = await loadProgress(opts.actor.orgId, opts.childMembershipId);
  const catalog = await loadCatalog(opts.actor.orgId);
  const items = assemblePathItems({
    intent,
    progress,
    catalog,
    prompt: opts.prompt,
  });
  return insertPath({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    intentId: intentRow.id,
    status: "proposed",
    prompt: opts.prompt ?? "",
    progress: {
      ...progress,
      intent: intentSnapshot(intent),
      catalogBound: items.filter((item) => item.composerLessonId).length,
    },
    items,
  });
}

export async function acceptCurriculumPath(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  pathId?: string;
}) {
  await assertChildInHousehold(opts);
  const db = getDb();
  const current = opts.pathId
    ? (
        await db
          .select()
          .from(curriculumPaths)
          .where(
            and(
              eq(curriculumPaths.id, opts.pathId),
              eq(curriculumPaths.orgId, opts.actor.orgId),
              eq(curriculumPaths.childMembershipId, opts.childMembershipId),
            ),
          )
          .limit(1)
      )[0]
    : await latestPath(opts.actor.orgId, opts.childMembershipId);
  if (!current) throw new CurriculumFieldsError("path_required");
  const [row] = await db
    .update(curriculumPaths)
    .set({
      status: "accepted",
      acceptedAt: current.acceptedAt ?? new Date(),
    })
    .where(
      and(eq(curriculumPaths.id, current.id), eq(curriculumPaths.orgId, opts.actor.orgId)),
    )
    .returning();
  const items = await loadItems(opts.actor.orgId, [row.id]);
  return publicPath(row, items);
}

export async function editCurriculumPath(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  body: Record<string, unknown>;
}) {
  await assertChildInHousehold(opts);
  const items = parsePathItems(opts.body.items ?? opts.body.path);
  if (!pathHasItems(items)) throw new CurriculumFieldsError("items_required");
  const intentRow = await latestIntent(opts.actor.orgId, opts.childMembershipId);
  const latest = await latestPath(opts.actor.orgId, opts.childMembershipId);
  const progress = await loadProgress(opts.actor.orgId, opts.childMembershipId);
  return insertPath({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    intentId: intentRow?.id ?? latest?.intentId ?? null,
    status: "edited",
    prompt: typeof opts.body.prompt === "string" ? opts.body.prompt : latest?.prompt ?? "",
    progress: {
      ...progress,
      intent: intentRow ? intentSnapshot(fieldsFromIntent(intentRow)) : {},
      editedFrom: latest?.id ?? null,
    },
    items,
  });
}
