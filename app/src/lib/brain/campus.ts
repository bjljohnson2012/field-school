import {
  type BrainItemDraft,
  type BrainSnapshot,
  campusSynced,
  campusUri,
  type CampusSynced,
} from "./rules.ts";

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

export function emptyFamilyBundle(): CampusObjectBundle {
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
