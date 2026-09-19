export const FAMILY_MODE = "family";
export const HOUSEHOLD_SLUG = "household";
export const INTENT_TAG_KEYS = ["knowledge", "confidence", "development", "next"] as const;
export const INTENT_CONFIDENCE = ["not_yet", "getting_there", "ready", ""] as const;

export type IntentConfidence = (typeof INTENT_CONFIDENCE)[number];

export type IntentTags = {
  knowledge?: string[];
  confidence?: IntentConfidence;
  development?: string[];
  next?: string[];
};

export type IntentFields = {
  goals: string[];
  subjects: string[];
  themes: string[];
  timeHorizon: string;
  constraints: string[];
  tags: IntentTags;
};

function orgFeatureMode(features: unknown) {
  if (!features || typeof features !== "object" || Array.isArray(features)) return "";
  const mode = (features as { mode?: unknown }).mode;
  return typeof mode === "string" ? mode : "";
}

export function isFamilyOrg(actor: { orgSlug: string; features?: unknown }) {
  return actor.orgSlug === HOUSEHOLD_SLUG && orgFeatureMode(actor.features) === FAMILY_MODE;
}

export function isFamilyParentUser(actor: { kind: string; mode?: string }) {
  return actor.kind !== "child" && actor.mode === FAMILY_MODE;
}

export function canWriteIntent(
  actor: {
    kind: string;
    stance: string;
    orgSlug: string;
    mode?: string;
    features?: unknown;
  },
  staff: boolean,
) {
  if (actor.kind === "child") return false;
  if (actor.orgSlug !== HOUSEHOLD_SLUG) return false;
  if (!isFamilyOrg(actor) && !isFamilyParentUser(actor) && !staff) return false;
  return staff || actor.stance === "admin" || actor.stance === "guardian";
}

export function canReadIntent(
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

export function asStringList(value: unknown, max = 32) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,]/)
      : [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, max)
    .map((item) => item.slice(0, 400));
}

export function asTimeHorizon(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

export function asIntentTags(value: unknown): IntentTags {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const tags: IntentTags = {};
  if ("knowledge" in raw) tags.knowledge = asStringList(raw.knowledge);
  if ("confidence" in raw && typeof raw.confidence === "string") {
    if ((INTENT_CONFIDENCE as readonly string[]).includes(raw.confidence)) {
      tags.confidence = raw.confidence as IntentConfidence;
    }
  }
  if ("development" in raw) tags.development = asStringList(raw.development);
  if ("next" in raw) tags.next = asStringList(raw.next);
  return tags;
}

export function parseIntentFields(body: Record<string, unknown>): IntentFields {
  return {
    goals: asStringList(body.goals),
    subjects: asStringList(body.subjects),
    themes: asStringList(body.themes),
    timeHorizon: asTimeHorizon(body.timeHorizon ?? body.time_horizon),
    constraints: asStringList(body.constraints),
    tags: asIntentTags(body.tags),
  };
}

export function mergeIntentFields(base: IntentFields, next: IntentFields): IntentFields {
  return {
    goals: next.goals.length ? next.goals : base.goals,
    subjects: next.subjects.length ? next.subjects : base.subjects,
    themes: next.themes.length ? next.themes : base.themes,
    timeHorizon: next.timeHorizon || base.timeHorizon,
    constraints: next.constraints.length ? next.constraints : base.constraints,
    tags: Object.keys(next.tags).length ? { ...base.tags, ...next.tags } : base.tags,
  };
}

export function intentHasPlanFields(fields: IntentFields) {
  return Boolean(
    fields.goals.length ||
      fields.subjects.length ||
      fields.themes.length ||
      fields.timeHorizon ||
      fields.constraints.length,
  );
}
