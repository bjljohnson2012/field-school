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
  type BrainItemDraft,
  type BrainSnapshot,
  campusSynced,
  campusUri,
  type CampusSynced,
} from "./rules";

export type CampusIntent = {
  id: string;
  version: number;
  goals: string[];
  subjects: string[];
  themes: string[];
  timeHorizon: string;
  constraints: string[];
  tags: Record<string, unknown>;
};

export type CampusStation = {
  id: string;
  title: string;
  subject: string;
  reason: string;
  source: string;
  status?: string;
  confidence?: string;
  composerLessonId: string | null;
  composerUnitId: string | null;
};

export type CampusPath = {
  id: string;
  version: number;
  status: string;
  intentId: string | null;
  items: CampusStation[];
};

export type CampusPortion = {
  id: string;
  version: number;
  status: string;
  pathId: string | null;
  intentId: string | null;
  horizon: string;
  title: string;
  items: CampusStation[];
};

export type CampusLedger = {
  id: string;
  version: number;
  pathId: string | null;
  portionId: string | null;
  intentId: string | null;
  summary: Record<string, unknown>;
  units: CampusStation[];
};

export type CampusNote = {
  id: string;
  body: string;
};

export type CampusCatalog = {
  lessonId: string;
  sourceId: string | null;
  unitId: string | null;
  title: string;
  body: string;
  url: string;
};

export type CampusObjectBundle = {
  kind: "child" | "family";
  intent: CampusIntent | null;
  path: CampusPath | null;
  portion: CampusPortion | null;
  ledger: CampusLedger | null;
  notes: CampusNote[];
  catalog: CampusCatalog[];
};

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

function draft(
  title: string,
  body: string,
  uri: string,
  refs?: { composerSourceId?: string | null; composerUnitId?: string | null },
): BrainItemDraft {
  return {
    sortOrder: 0,
    title: title.trim().slice(0, 400),
    body: body.trim().slice(0, 8000),
    uri,
    composerSourceId: refs?.composerSourceId ?? null,
    composerUnitId: refs?.composerUnitId ?? null,
  };
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function campusSnapshotBags(bundle: CampusObjectBundle): {
  intent: BrainSnapshot;
  paths: BrainSnapshot;
  progress: BrainSnapshot;
  synced: CampusSynced;
} {
  const intent: BrainSnapshot = bundle.intent
    ? {
        id: bundle.intent.id,
        version: bundle.intent.version,
        goals: bundle.intent.goals,
        subjects: bundle.intent.subjects,
        themes: bundle.intent.themes,
        timeHorizon: bundle.intent.timeHorizon,
        constraints: bundle.intent.constraints,
        tags: bundle.intent.tags,
      }
    : {};
  const paths: BrainSnapshot = bundle.kind === "family"
    ? { kind: "family" }
    : {
        ...(bundle.path
          ? {
              pathId: bundle.path.id,
              pathVersion: bundle.path.version,
              pathStatus: bundle.path.status,
              stations: bundle.path.items.map((item) => ({
                title: item.title,
                subject: item.subject,
                source: item.source,
              })),
            }
          : {}),
        ...(bundle.portion
          ? {
              portionId: bundle.portion.id,
              portionVersion: bundle.portion.version,
              portionStatus: bundle.portion.status,
              horizon: bundle.portion.horizon,
              portionTitle: bundle.portion.title,
            }
          : {}),
      };
  const progress: BrainSnapshot = bundle.ledger
    ? {
        ledgerId: bundle.ledger.id,
        version: bundle.ledger.version,
        completed: numberFrom(bundle.ledger.summary.completed),
        inProgress: numberFrom(bundle.ledger.summary.inProgress ?? bundle.ledger.summary.in_progress),
        recommended: numberFrom(bundle.ledger.summary.recommended),
        units: bundle.ledger.units.map((unit) => ({
          title: unit.title,
          status: unit.status ?? "",
          confidence: unit.confidence ?? "",
        })),
      }
    : {};
  return {
    intent,
    paths,
    progress,
    synced: campusSynced({
      intent: Boolean(bundle.intent),
      path: Boolean(bundle.path),
      portion: Boolean(bundle.portion),
      ledger: Boolean(bundle.ledger),
      parentNotes: bundle.notes.length,
      catalog: bundle.catalog.length,
    }),
  };
}

export function materializeCampusDrafts(bundle: CampusObjectBundle): {
  sources: BrainItemDraft[];
  notes: BrainItemDraft[];
  artifacts: BrainItemDraft[];
} {
  const notes: BrainItemDraft[] = [];
  if (bundle.intent) {
    const body = [...bundle.intent.goals, ...bundle.intent.subjects, ...bundle.intent.themes]
      .filter(Boolean)
      .join(" · ");
    notes.push(draft("Learning intent", body || bundle.intent.timeHorizon, campusUri("intent", bundle.intent.id)));
  }
  for (const note of bundle.notes.slice(0, 32)) {
    notes.push(draft("Parent note", note.body, campusUri("event", note.id)));
  }

  const sources = bundle.catalog.slice(0, 64).map((row) =>
    draft(row.title, row.body, campusUri("composer-source", row.sourceId || row.lessonId), {
      composerSourceId: row.sourceId,
      composerUnitId: row.unitId,
    }),
  );

  const artifacts: BrainItemDraft[] = [];
  for (const item of bundle.path?.items ?? []) {
    artifacts.push(
      draft(item.title, item.reason || item.subject, campusUri("path-item", item.id), {
        composerUnitId: item.composerUnitId,
      }),
    );
  }
  for (const item of bundle.portion?.items ?? []) {
    artifacts.push(
      draft(item.title, item.reason || item.subject, campusUri("portion-item", item.id), {
        composerUnitId: item.composerUnitId,
      }),
    );
  }
  for (const item of bundle.ledger?.units ?? []) {
    const body = [item.status, item.confidence, item.subject].filter(Boolean).join(" · ");
    artifacts.push(
      draft(item.title, body, campusUri("ledger-unit", item.id), {
        composerUnitId: item.composerUnitId,
      }),
    );
  }

  return {
    sources: sources.slice(0, 64).map((item, index) => ({ ...item, sortOrder: index + 1 })),
    notes: notes.slice(0, 64).map((item, index) => ({ ...item, sortOrder: index + 1 })),
    artifacts: artifacts.slice(0, 64).map((item, index) => ({ ...item, sortOrder: index + 1 })),
  };
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
    return {
      kind: "family",
      intent: null,
      path: null,
      portion: null,
      ledger: null,
      notes: [],
      catalog: [],
    };
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

export function publicCampusBundle(bundle: CampusObjectBundle) {
  return {
    kind: bundle.kind,
    intent: bundle.intent,
    path: bundle.path,
    portion: bundle.portion,
    ledger: bundle.ledger,
    notes: bundle.notes,
    catalog: bundle.catalog,
  };
}
