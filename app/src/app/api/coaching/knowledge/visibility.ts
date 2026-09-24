export const STORED_VISIBILITY = ["learner", "coach", "both"] as const;
export type StoredVisibility = (typeof STORED_VISIBILITY)[number];

export const REPO_KINDS = ["PRODUCT", "SALES_SKILL", "PERSONALITY", "LEADERSHIP", "CUSTOM"] as const;
export type RepoKind = (typeof REPO_KINDS)[number];

export const UNIT_STATUSES = ["pending", "approved", "rejected"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID.test(value);
}

const AE_VISIBILITY: Record<string, StoredVisibility> = {
  AE_ONLY: "learner",
  DIRECTOR_ONLY: "coach",
  BOTH: "both",
};

export function isRepoKind(value: string): value is RepoKind {
  return (REPO_KINDS as readonly string[]).includes(value);
}

export function isUnitStatus(value: string): value is UnitStatus {
  return (UNIT_STATUSES as readonly string[]).includes(value);
}

export function isStoredVisibility(value: string): value is StoredVisibility {
  return (STORED_VISIBILITY as readonly string[]).includes(value);
}

/** Map AE visibility enums at the write boundary. Never returns AE_ONLY, DIRECTOR_ONLY, or BOTH. */
export function persistVisibility(value: unknown, repoKind?: string | null): StoredVisibility | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    const kind = (repoKind ?? "").trim().toUpperCase();
    if (kind === "PERSONALITY" || kind === "LEADERSHIP") return "coach";
    return null;
  }
  const mapped = AE_VISIBILITY[raw.toUpperCase()];
  if (mapped) return mapped;
  if (isStoredVisibility(raw)) return raw;
  return null;
}

export function defaultVisibilityForRepo(repoKind: string): StoredVisibility {
  const kind = repoKind.trim().toUpperCase();
  if (kind === "PERSONALITY" || kind === "LEADERSHIP") return "coach";
  return "both";
}

export function visibilityForWrite(value: unknown, repoKind?: string | null): StoredVisibility {
  return persistVisibility(value, repoKind) ?? defaultVisibilityForRepo(repoKind ?? "");
}

export function learnerCanReadUnit(unit: { status: string; visibility: string }) {
  return unit.status === "approved" && (unit.visibility === "learner" || unit.visibility === "both");
}
