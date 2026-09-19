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
import { knowledgeUnits, lessons, sources } from "@/lib/composer/schema";
import {
  type CampusCatalog,
  type CampusObjectBundle,
  type CampusStation,
  emptyFamilyBundle,
} from "./campus";

function asList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asBag(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((id): id is string => Boolean(id)))];
}

function stationFromPath(row: typeof curriculumPathItems.$inferSelect): CampusStation {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    reason: row.reason,
    source: row.source,
    composerLessonId: row.composerLessonId,
    composerUnitId: row.composerUnitId,
  };
}

function stationFromPortion(row: typeof nextPortionItems.$inferSelect): CampusStation {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    reason: row.reason,
    source: row.source,
    composerLessonId: row.composerLessonId,
    composerUnitId: row.composerUnitId,
  };
}

function stationFromLedger(row: typeof progressLedgerUnits.$inferSelect): CampusStation {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    reason: "",
    source: row.source,
    status: row.status,
    confidence: row.confidence,
    composerLessonId: row.composerLessonId,
    composerUnitId: row.composerUnitId,
  };
}

async function catalogFor(orgId: string, stations: CampusStation[]): Promise<CampusCatalog[]> {
  const lessonIds = uniqueIds(stations.map((row) => row.composerLessonId));
  const unitIds = uniqueIds(stations.map((row) => row.composerUnitId));
  if (!lessonIds.length && !unitIds.length) return [];
  const db = getDb();
  const unitRows = unitIds.length
    ? await db
        .select()
        .from(knowledgeUnits)
        .where(and(eq(knowledgeUnits.orgId, orgId), inArray(knowledgeUnits.id, unitIds)))
    : [];
  const sourceIds = uniqueIds(unitRows.map((row) => row.sourceId));
  const lessonRows = lessonIds.length
    ? await db
        .select()
        .from(lessons)
        .where(
          and(eq(lessons.orgId, orgId), eq(lessons.status, "published"), inArray(lessons.id, lessonIds)),
        )
    : [];
  const sourceRows = sourceIds.length
    ? await db
        .select()
        .from(sources)
        .where(and(eq(sources.orgId, orgId), inArray(sources.id, sourceIds)))
    : [];
  const byLesson = new Map(lessonRows.map((row) => [row.id, row]));
  const bySource = new Map(sourceRows.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const catalog: CampusCatalog[] = [];
  for (const unit of unitRows) {
    const source = bySource.get(unit.sourceId);
    const lesson = unit.lessonId ? byLesson.get(unit.lessonId) : undefined;
    const key = source?.id || unit.id;
    if (seen.has(key)) continue;
    seen.add(key);
    catalog.push({
      lessonId: unit.lessonId || lesson?.id || "",
      sourceId: source?.id ?? null,
      unitId: unit.id,
      title: source?.title || unit.title || lesson?.title || "Catalog unit",
      body: source?.body || unit.body || "",
      url: source?.url || "",
    });
  }
  for (const lesson of lessonRows) {
    if (seen.has(lesson.id)) continue;
    seen.add(lesson.id);
    catalog.push({
      lessonId: lesson.id,
      sourceId: null,
      unitId: null,
      title: lesson.title,
      body: lesson.body,
      url: "",
    });
  }
  return catalog.slice(0, 64);
}

export async function collectCampusObjects(opts: {
  orgId: string;
  kind: "child" | "family";
  childMembershipId?: string | null;
}): Promise<CampusObjectBundle> {
  if (opts.kind !== "child" || !opts.childMembershipId) {
    return emptyFamilyBundle();
  }
  const db = getDb();
  const childMembershipId = opts.childMembershipId;
  const [intentRow] = await db
    .select()
    .from(learningIntents)
    .where(and(eq(learningIntents.orgId, opts.orgId), eq(learningIntents.childMembershipId, childMembershipId)))
    .orderBy(desc(learningIntents.version))
    .limit(1);
  const [pathRow] = await db
    .select()
    .from(curriculumPaths)
    .where(
      and(
        eq(curriculumPaths.orgId, opts.orgId),
        eq(curriculumPaths.childMembershipId, childMembershipId),
        eq(curriculumPaths.status, "accepted"),
      ),
    )
    .orderBy(desc(curriculumPaths.version))
    .limit(1);
  const portions = await db
    .select()
    .from(nextPortions)
    .where(and(eq(nextPortions.orgId, opts.orgId), eq(nextPortions.childMembershipId, childMembershipId)))
    .orderBy(desc(nextPortions.version));
  const portionRow = portions.find((row) => row.status === "locked") ?? portions[0] ?? null;
  const [ledgerRow] = await db
    .select()
    .from(progressLedgers)
    .where(and(eq(progressLedgers.orgId, opts.orgId), eq(progressLedgers.childMembershipId, childMembershipId)))
    .orderBy(desc(progressLedgers.version))
    .limit(1);
  const pathItems = pathRow
    ? await db
        .select()
        .from(curriculumPathItems)
        .where(and(eq(curriculumPathItems.orgId, opts.orgId), eq(curriculumPathItems.pathId, pathRow.id)))
        .orderBy(asc(curriculumPathItems.sortOrder))
    : [];
  const portionItems = portionRow
    ? await db
        .select()
        .from(nextPortionItems)
        .where(and(eq(nextPortionItems.orgId, opts.orgId), eq(nextPortionItems.portionId, portionRow.id)))
        .orderBy(asc(nextPortionItems.sortOrder))
    : [];
  const ledgerUnits = ledgerRow
    ? await db
        .select()
        .from(progressLedgerUnits)
        .where(and(eq(progressLedgerUnits.orgId, opts.orgId), eq(progressLedgerUnits.ledgerId, ledgerRow.id)))
        .orderBy(asc(progressLedgerUnits.sortOrder))
    : [];
  const noteRows = await db
    .select()
    .from(learningEvents)
    .where(
      and(
        eq(learningEvents.orgId, opts.orgId),
        eq(learningEvents.membershipId, childMembershipId),
        eq(learningEvents.objectId, "parent-note"),
      ),
    )
    .orderBy(desc(learningEvents.createdAt))
    .limit(32);

  const path = pathRow
    ? {
        id: pathRow.id,
        version: pathRow.version,
        status: pathRow.status,
        intentId: pathRow.intentId,
        items: pathItems.map(stationFromPath),
      }
    : null;
  const portion = portionRow
    ? {
        id: portionRow.id,
        version: portionRow.version,
        status: portionRow.status,
        pathId: portionRow.pathId,
        intentId: portionRow.intentId,
        horizon: portionRow.horizon,
        title: portionRow.title,
        items: portionItems.map(stationFromPortion),
      }
    : null;
  const ledger = ledgerRow
    ? {
        id: ledgerRow.id,
        version: ledgerRow.version,
        pathId: ledgerRow.pathId,
        portionId: ledgerRow.portionId,
        intentId: ledgerRow.intentId,
        summary: asBag(ledgerRow.summary),
        units: ledgerUnits.map(stationFromLedger),
      }
    : null;
  const stations = [
    ...(path?.items ?? []),
    ...(portion?.items ?? []),
    ...(ledger?.units ?? []),
  ];
  return {
    kind: "child",
    intent: intentRow
      ? {
          id: intentRow.id,
          version: intentRow.version,
          goals: asList(intentRow.goals),
          subjects: asList(intentRow.subjects),
          themes: asList(intentRow.themes),
          timeHorizon: intentRow.timeHorizon,
          constraints: asList(intentRow.constraints),
          tags: asBag(intentRow.tags),
        }
      : null,
    path,
    portion,
    ledger,
    notes: noteRows.map((row) => {
      const raw = asBag(row.raw);
      return {
        id: row.id,
        body: typeof raw.notes === "string" ? raw.notes : "",
      };
    }).filter((note) => note.body),
    catalog: await catalogFor(opts.orgId, stations),
  };
}
