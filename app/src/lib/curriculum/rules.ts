import {
  asStringList,
  canReadIntent,
  canWriteIntent,
  type IntentFields,
} from "../intent/rules.ts";

export const PATH_STATUSES = ["proposed", "accepted", "edited"] as const;
export const PATH_ITEM_SOURCES = ["intent", "progress", "catalog", "prompt"] as const;
export const PATH_ACTIONS = ["accept", "edit", "re-prompt"] as const;

export type PathStatus = (typeof PATH_STATUSES)[number];
export type PathItemSource = (typeof PATH_ITEM_SOURCES)[number];
export type PathAction = (typeof PATH_ACTIONS)[number];

export type PathItemDraft = {
  sortOrder: number;
  title: string;
  subject: string;
  kind: "station";
  reason: string;
  source: PathItemSource;
  composerLessonId: string | null;
  composerUnitId: string | null;
};

export type CatalogLesson = {
  id: string;
  title: string;
  courseTitle: string;
  status: string;
  units: Array<{ id: string; title: string }>;
};

export type ChildProgress = {
  welcomeWatched: boolean;
  eventCount: number;
  notes: string[];
  covered: string[];
  priorTitles: string[];
};

export function canWriteCurriculum(
  actor: {
    kind: string;
    stance: string;
    orgSlug: string;
    mode?: string;
    features?: unknown;
  },
  staff: boolean,
) {
  return canWriteIntent(actor, staff);
}

export function canReadCurriculum(
  actor: {
    kind: string;
    stance: string;
    orgSlug: string;
    mode?: string;
    features?: unknown;
  },
  staff: boolean,
) {
  return canReadIntent(actor, staff);
}

export function asPrompt(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

export function asPathAction(value: unknown): PathAction | "" {
  return typeof value === "string" && (PATH_ACTIONS as readonly string[]).includes(value)
    ? (value as PathAction)
    : "";
}

function asSource(value: unknown): PathItemSource {
  return typeof value === "string" && (PATH_ITEM_SOURCES as readonly string[]).includes(value)
    ? (value as PathItemSource)
    : "intent";
}

function asOptionalId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;
}

export function parsePathItems(value: unknown): PathItemDraft[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? asStringList(value, 48).map((title) => ({ title }))
      : [];
  const items: PathItemDraft[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const row =
      typeof entry === "string"
        ? { title: entry }
        : entry && typeof entry === "object"
          ? (entry as Record<string, unknown>)
          : null;
    if (!row) continue;
    const title = typeof row.title === "string" ? row.title.trim().slice(0, 400) : "";
    const key = title.toLowerCase();
    if (!title || seen.has(key)) continue;
    seen.add(key);
    items.push({
      sortOrder: items.length + 1,
      title,
      subject: typeof row.subject === "string" ? row.subject.trim().slice(0, 200) : "",
      kind: "station",
      reason: typeof row.reason === "string" ? row.reason.trim().slice(0, 400) : "Parent edit",
      source: asSource(row.source),
      composerLessonId: asOptionalId(row.composerLessonId ?? row.composer_lesson_id),
      composerUnitId: asOptionalId(row.composerUnitId ?? row.composer_unit_id),
    });
  }
  return items;
}

export function pathHasItems(items: PathItemDraft[]) {
  return items.length > 0;
}

export function intentSnapshot(intent: IntentFields | null) {
  return {
    goals: intent?.goals ?? [],
    subjects: intent?.subjects ?? [],
    themes: intent?.themes ?? [],
    timeHorizon: intent?.timeHorizon ?? "",
    constraints: intent?.constraints ?? [],
  };
}
