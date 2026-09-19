import { canReadIntent, canWriteIntent } from "../intent/rules.ts";

export const LEDGER_STATUSES = ["current"] as const;
export const LEDGER_UNIT_STATUSES = ["completed", "in_progress", "recommended"] as const;
export const LEDGER_UNIT_SOURCES = ["refresh", "event", "portion", "path", "parent"] as const;
export const LEDGER_ACTIONS = ["start", "complete", "confidence"] as const;
export const LEDGER_CONFIDENCE = ["not_yet", "getting_there", "ready", ""] as const;
export const LEDGER_FLAGS = ["stuck", "easy", ""] as const;

export type LedgerStatus = (typeof LEDGER_STATUSES)[number];
export type LedgerUnitStatus = (typeof LEDGER_UNIT_STATUSES)[number];
export type LedgerUnitSource = (typeof LEDGER_UNIT_SOURCES)[number];
export type LedgerAction = (typeof LEDGER_ACTIONS)[number];
export type LedgerConfidence = (typeof LEDGER_CONFIDENCE)[number];
export type LedgerFlag = (typeof LEDGER_FLAGS)[number];

export type LedgerStation = {
  id?: string;
  pathItemId?: string | null;
  portionItemId?: string | null;
  sortOrder?: number;
  title: string;
  subject: string;
  composerLessonId: string | null;
  composerUnitId: string | null;
  onPortion?: boolean;
};

export type LedgerUnitDraft = {
  sortOrder: number;
  title: string;
  subject: string;
  status: LedgerUnitStatus;
  source: LedgerUnitSource;
  pathItemId: string | null;
  portionItemId: string | null;
  composerLessonId: string | null;
  composerUnitId: string | null;
  confidence: LedgerConfidence;
  flag: LedgerFlag;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type ChildProgress = {
  welcomeWatched: boolean;
  eventCount: number;
  notes: string[];
  covered: string[];
  started: string[];
};

export type PersistedUnit = {
  title: string;
  status: LedgerUnitStatus;
  confidence?: LedgerConfidence;
  flag?: LedgerFlag;
  startedAt?: string | null;
  completedAt?: string | null;
};

export function canWriteLedger(
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

export function canReadLedger(
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

export function asLedgerAction(value: unknown): LedgerAction | "" {
  return typeof value === "string" && (LEDGER_ACTIONS as readonly string[]).includes(value)
    ? (value as LedgerAction)
    : "";
}

export function asUnitStatus(value: unknown): LedgerUnitStatus {
  return typeof value === "string" && (LEDGER_UNIT_STATUSES as readonly string[]).includes(value)
    ? (value as LedgerUnitStatus)
    : "recommended";
}

export function asTitle(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 400) : "";
}

export function asConfidence(value: unknown): LedgerConfidence {
  if (typeof value !== "string") return "";
  const raw = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (raw === "not_yet" || raw === "not-yet") return "not_yet";
  if (raw === "getting_there" || raw === "getting-there") return "getting_there";
  if (raw === "ready") return "ready";
  return (LEDGER_CONFIDENCE as readonly string[]).includes(raw) ? (raw as LedgerConfidence) : "";
}

export function asFlag(value: unknown): LedgerFlag {
  if (typeof value !== "string") return "";
  const raw = value.trim().toLowerCase();
  return (LEDGER_FLAGS as readonly string[]).includes(raw) ? (raw as LedgerFlag) : "";
}

export function confidenceLabel(value: LedgerConfidence) {
  if (value === "not_yet") return "Not yet";
  if (value === "getting_there") return "Getting there";
  if (value === "ready") return "Ready";
  return "";
}

function asOptionalId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;
}

export function parseLedgerUnitPatch(body: Record<string, unknown>) {
  return {
    title: asTitle(body.title ?? body.objectId ?? body.object_id),
    subject: typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "",
    pathItemId: asOptionalId(body.pathItemId ?? body.path_item_id),
    portionItemId: asOptionalId(body.portionItemId ?? body.portion_item_id),
    composerLessonId: asOptionalId(body.composerLessonId ?? body.composer_lesson_id),
    composerUnitId: asOptionalId(body.composerUnitId ?? body.composer_unit_id),
    confidence: asConfidence(body.confidence),
    flag: asFlag(body.flag),
  };
}

export function ledgerHasUnits(units: LedgerUnitDraft[]) {
  return units.length > 0;
}
