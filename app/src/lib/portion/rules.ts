import { canReadIntent, canWriteIntent } from "../intent/rules.ts";

export const PORTION_STATUSES = ["suggested", "locked", "overridden"] as const;
export const PORTION_HORIZONS = ["week", "module"] as const;
export const PORTION_ITEM_SOURCES = ["remaining", "intent", "progress", "override"] as const;
export const PORTION_ACTIONS = ["lock", "override"] as const;

export type PortionStatus = (typeof PORTION_STATUSES)[number];
export type PortionHorizon = (typeof PORTION_HORIZONS)[number];
export type PortionItemSource = (typeof PORTION_ITEM_SOURCES)[number];
export type PortionAction = (typeof PORTION_ACTIONS)[number];

export type PathStation = {
  id?: string;
  sortOrder?: number;
  title: string;
  subject: string;
  reason?: string;
  source?: string;
  composerLessonId: string | null;
  composerUnitId: string | null;
};

export type PortionItemDraft = {
  sortOrder: number;
  title: string;
  subject: string;
  reason: string;
  source: PortionItemSource;
  pathItemId: string | null;
  composerLessonId: string | null;
  composerUnitId: string | null;
};

export type ChildProgress = {
  welcomeWatched: boolean;
  eventCount: number;
  notes: string[];
  covered: string[];
};

export function canWritePortion(
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

export function canReadPortion(
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

export function asPortionAction(value: unknown): PortionAction | "" {
  return typeof value === "string" && (PORTION_ACTIONS as readonly string[]).includes(value)
    ? (value as PortionAction)
    : "";
}

export function asHorizon(value: unknown): PortionHorizon {
  if (typeof value !== "string") return "week";
  const raw = value.trim().toLowerCase();
  if (raw === "module" || raw.includes("module")) return "module";
  if (raw === "week" || raw.includes("week") || raw.includes("term")) return "week";
  return (PORTION_HORIZONS as readonly string[]).includes(raw) ? (raw as PortionHorizon) : "week";
}

export function horizonLabel(horizon: PortionHorizon) {
  return horizon === "module" ? "next module" : "next week";
}

function asOptionalId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;
}

function asSource(value: unknown): PortionItemSource {
  return typeof value === "string" && (PORTION_ITEM_SOURCES as readonly string[]).includes(value)
    ? (value as PortionItemSource)
    : "override";
}

export function parsePortionItems(value: unknown): PortionItemDraft[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(/[\n,]/)
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title) => ({ title }))
      : [];
  const items: PortionItemDraft[] = [];
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
      reason: typeof row.reason === "string" ? row.reason.trim().slice(0, 400) : "Parent override",
      source: asSource(row.source),
      pathItemId: asOptionalId(row.pathItemId ?? row.path_item_id),
      composerLessonId: asOptionalId(row.composerLessonId ?? row.composer_lesson_id),
      composerUnitId: asOptionalId(row.composerUnitId ?? row.composer_unit_id),
    });
  }
  return items;
}

export function portionHasItems(items: PortionItemDraft[]) {
  return items.length > 0;
}

export function asTitle(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 400) : "";
}

export function asReason(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 400) : "";
}
