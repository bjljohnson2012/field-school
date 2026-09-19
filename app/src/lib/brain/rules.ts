import { canReadIntent, canWriteIntent } from "../intent/rules.ts";

export const GROWTH_UNIT_KINDS = ["person", "child", "family", "team", "org"] as const;
export const FAMILY_FIRST_KINDS = ["child", "family"] as const;
export const BRAIN_ITEM_KINDS = ["source", "note", "artifact"] as const;

export type GrowthKind = (typeof GROWTH_UNIT_KINDS)[number];
export type FamilyFirstKind = (typeof FAMILY_FIRST_KINDS)[number];
export type BrainItemKind = (typeof BRAIN_ITEM_KINDS)[number];

export type BrainItemDraft = {
  sortOrder: number;
  title: string;
  body: string;
  uri: string;
  composerSourceId: string | null;
  composerUnitId: string | null;
};

export type BrainSnapshot = Record<string, unknown>;

export function canWriteBrain(
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

export function canReadBrain(
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

export function asGrowthKind(value: unknown): GrowthKind | "" {
  return typeof value === "string" && (GROWTH_UNIT_KINDS as readonly string[]).includes(value)
    ? (value as GrowthKind)
    : "";
}

export function isFamilyFirstKind(kind: string): kind is FamilyFirstKind {
  return kind === "child" || kind === "family";
}

export function asTitle(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 400) : "";
}

function asOptionalId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;
}

function asItemText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseBrainItems(value: unknown): BrainItemDraft[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 64)
    .map((item, index) => {
      const raw =
        item && typeof item === "object" && !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {};
      return {
        sortOrder: index + 1,
        title: asTitle(raw.title),
        body: asItemText(raw.body, 8000),
        uri: asItemText(raw.uri, 2000),
        composerSourceId: asOptionalId(raw.composerSourceId ?? raw.composer_source_id),
        composerUnitId: asOptionalId(raw.composerUnitId ?? raw.composer_unit_id),
      };
    })
    .filter((item) => item.title || item.body || item.uri);
}

function asPlainValue(value: unknown): unknown {
  if (typeof value === "string") return value.slice(0, 400);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 32).map((item) => asPlainValue(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value).slice(0, 32)) {
      const name = key.trim().slice(0, 80);
      if (name) out[name] = asPlainValue(nested);
    }
    return out;
  }
  return null;
}

export function asSnapshotBag(value: unknown): BrainSnapshot {
  const parsed = asPlainValue(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as BrainSnapshot)
    : {};
}

export function snapshotHasKeys(value: BrainSnapshot) {
  return Object.keys(value).length > 0;
}

export function brainSummary(counts: { sources: number; notes: number; artifacts: number }) {
  return {
    sources: counts.sources,
    notes: counts.notes,
    artifacts: counts.artifacts,
  };
}
