/**
 * Profile M1. Adult profile is keyed by the signed-in User (members.id).
 * Kid profile is a subject under the parent User; only the parent edits it.
 * M1 has no public share URL, no resume or LinkedIn ingest, and no nudge.
 */

export const PROFILE_COPY = {
  incomplete: "Finish setting up your profile",
  complete: "Your profile is done",
  entry: "View Profile",
} as const;

export type AdultGateId = "G-personality" | "G-skills" | "G-other";
export type KidGateId = "G-intake";

export type GateDef<Id extends string> = {
  id: Id;
  label: string;
  feed: string;
  href: string | null;
  required: true;
};

/** Locked map: PROFILE-GATE-MAP-M1. Org /skills and coaching /intake are not gates. */
export const ADULT_GATES: readonly GateDef<AdultGateId>[] = [
  {
    id: "G-personality",
    label: "Complete personality assessment",
    feed: "Field Pattern (fp-50-v1)",
    href: "/pattern",
    required: true,
  },
  {
    id: "G-skills",
    label: "Complete skills assessment",
    feed: "Tools · Skill assessment",
    href: "/tools/skill",
    required: true,
  },
  {
    id: "G-other",
    label: "Complete other profile assessment",
    feed: "Tools · Intelligence assessment",
    href: "/tools/intelligence",
    required: true,
  },
];

/** Product stub until the live intake form is named. No intake id is invented. */
export const KID_GATES: readonly GateDef<KidGateId>[] = [
  {
    id: "G-intake",
    label: "Complete intake form",
    feed: "Intake form not named yet",
    href: null,
    required: true,
  },
];

export const KID_COPY = {
  incomplete: "Intake form not done yet",
  complete: "Intake done",
} as const;

export type GateMark = { firstAt: string; lastAt: string };
export type GateMarks = Partial<Record<AdultGateId, GateMark>>;

const TOOL_GATE: Record<string, AdultGateId> = {
  skill: "G-skills",
  intelligence: "G-other",
};

export function gateForTool(slug: string): AdultGateId | null {
  return Object.prototype.hasOwnProperty.call(TOOL_GATE, slug) ? TOOL_GATE[slug] : null;
}

function isIso(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function readGateMarks(raw: unknown): GateMarks {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: GateMarks = {};
  for (const gate of ADULT_GATES) {
    const mark = (raw as Record<string, unknown>)[gate.id];
    if (!mark || typeof mark !== "object") continue;
    const { firstAt, lastAt } = mark as Record<string, unknown>;
    if (isIso(firstAt) && isIso(lastAt)) out[gate.id] = { firstAt, lastAt };
  }
  return out;
}

/** A re-run moves lastAt only. firstAt stays the first time the gate was met. */
export function markGate(marks: GateMarks, id: AdultGateId, at: Date): GateMarks {
  const iso = at.toISOString();
  const prior = marks[id];
  return { ...marks, [id]: { firstAt: prior?.firstAt ?? iso, lastAt: iso } };
}

export type AdultSetup = {
  done: number;
  total: number;
  complete: boolean;
  completedAt: string | null;
  headline: string;
  gates: {
    id: AdultGateId;
    label: string;
    feed: string;
    href: string | null;
    done: boolean;
    lastAt: string | null;
  }[];
};

/**
 * Completeness = AND of required gates. Once stored, completedAt never clears:
 * a later re-run refreshes freshness only (L-rerun).
 */
export function adultSetup(marks: GateMarks, storedCompletedAt: string | null, now: Date): AdultSetup {
  const gates = ADULT_GATES.map((gate) => ({
    id: gate.id,
    label: gate.label,
    feed: gate.feed,
    href: gate.href,
    done: Boolean(marks[gate.id]),
    lastAt: marks[gate.id]?.lastAt ?? null,
  }));
  const required = gates.filter((gate) => ADULT_GATES.find((g) => g.id === gate.id)?.required);
  const allDone = required.every((gate) => gate.done);
  const completedAt = storedCompletedAt ?? (allDone ? now.toISOString() : null);
  const complete = Boolean(completedAt);
  return {
    done: required.filter((gate) => gate.done).length,
    total: required.length,
    complete,
    completedAt,
    headline: complete ? PROFILE_COPY.complete : PROFILE_COPY.incomplete,
    gates,
  };
}

export type KidSetup = {
  done: number;
  total: number;
  complete: boolean;
  headline: string;
  gates: { id: KidGateId; label: string; feed: string; done: boolean; lastAt: string | null }[];
};

/** Adult G-* gates never count for a kid. */
export function kidSetup(intakeDoneAt: string | null): KidSetup {
  const done = Boolean(intakeDoneAt);
  return {
    done: done ? 1 : 0,
    total: KID_GATES.length,
    complete: done,
    headline: done ? KID_COPY.complete : KID_COPY.incomplete,
    gates: KID_GATES.map((gate) => ({
      id: gate.id,
      label: gate.label,
      feed: gate.feed,
      done,
      lastAt: intakeDoneAt,
    })),
  };
}

const DAY = 24 * 60 * 60 * 1000;

export function freshnessLabel(iso: string | null, now: Date): string {
  if (!iso || !isIso(iso)) return "Not taken yet";
  const at = new Date(iso);
  const days = Math.floor((now.getTime() - at.getTime()) / DAY);
  if (days <= 0) return "Taken today";
  if (days === 1) return "Taken yesterday";
  if (days < 30) return `Taken ${days} days ago`;
  return `Taken on ${at.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}`;
}

const NAME_MAX = 80;
const ITEM_MAX = 120;
const LIST_MAX = 12;
const PHOTO_MAX = 500;

export const ADULT_EDIT_FIELDS = ["displayName", "photoUrl", "currentProjects", "skillsAdapted"] as const;
export const KID_EDIT_FIELDS = ["displayName"] as const;

export type AdultPatch = {
  displayName?: string;
  photoUrl?: string;
  currentProjects?: string[];
  skillsAdapted?: string[];
};

type PatchResult<T> = { ok: true; patch: T } | { ok: false; error: string };

function cleanList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const text = item.trim().slice(0, ITEM_MAX);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    out.push(text);
  }
  return out.slice(0, LIST_MAX);
}

export function cleanPhotoUrl(value: string): string | null {
  const text = value.trim();
  if (!text) return "";
  if (text.length > PHOTO_MAX) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function unknownFields(body: Record<string, unknown>, allowed: readonly string[]) {
  return Object.keys(body).filter((key) => !allowed.includes(key));
}

export function sanitizeAdultPatch(body: unknown): PatchResult<AdultPatch> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_body" };
  }
  const input = body as Record<string, unknown>;
  const extra = unknownFields(input, ADULT_EDIT_FIELDS);
  if (extra.length) return { ok: false, error: `field_not_editable:${extra[0]}` };
  const patch: AdultPatch = {};
  if ("displayName" in input) {
    if (typeof input.displayName !== "string") return { ok: false, error: "display_name_invalid" };
    const name = input.displayName.trim();
    if (!name) return { ok: false, error: "display_name_required" };
    patch.displayName = name.slice(0, NAME_MAX);
  }
  if ("photoUrl" in input) {
    if (typeof input.photoUrl !== "string") return { ok: false, error: "photo_url_invalid" };
    const photo = cleanPhotoUrl(input.photoUrl);
    if (photo === null) return { ok: false, error: "photo_url_invalid" };
    patch.photoUrl = photo;
  }
  for (const key of ["currentProjects", "skillsAdapted"] as const) {
    if (!(key in input)) continue;
    const list = cleanList(input[key]);
    if (!list) return { ok: false, error: `${key}_invalid` };
    patch[key] = list;
  }
  return { ok: true, patch };
}

export function sanitizeKidPatch(body: unknown): PatchResult<{ displayName: string }> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_body" };
  }
  const input = body as Record<string, unknown>;
  if ("photoUrl" in input) return { ok: false, error: "kid_no_photo" };
  const extra = unknownFields(input, KID_EDIT_FIELDS);
  if (extra.length) return { ok: false, error: `field_not_editable:${extra[0]}` };
  if (typeof input.displayName !== "string" || !input.displayName.trim()) {
    return { ok: false, error: "display_name_required" };
  }
  return { ok: true, patch: { displayName: input.displayName.trim().slice(0, NAME_MAX) } };
}

export type KidActor = { kind: string; stance: string; orgSlug: string; membershipId: string };

/** Parent-only edit. A child never edits, and the sales room never sees a child. */
export function kidEditRefusal(actor: KidActor, guardianOfChild: boolean): string | null {
  if (actor.kind === "child") return "child_cannot_edit";
  if (actor.orgSlug !== "household") return "household_only";
  if (!guardianOfChild) return "not_your_child";
  return null;
}

export function listOfStrings(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}
