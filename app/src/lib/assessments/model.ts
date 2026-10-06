import { acceptsAnswer, trackMeter, type Answer, type Placement, type Prior, type RunState } from "./engine.ts";
import { TRACK_IDS, isTrackId, type TaxonomyId, type TrackDef, type TrackId } from "./tracks.ts";

export const WIZARD_COPY = {
  name: "Assessments",
  estimate: "Field School estimate. Not an official MBTI®, Enneagram, or DISC result.",
  unsettled: "We're not sure yet — here's our best read",
  rerun: "Retake",
} as const;

export const RETENTION_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export type RunStatus = "in_progress" | "complete" | "ceiling_unsettled" | "expired";

export type Refusal = "child_cannot_run_assessments" | "not_on_sales_board";

/** Adults only. A sales room keeps the Field Pattern carve for the Personality track. */
export function wizardRefusal(actor: { kind: string; orgSlug: string }, track: TrackId | null): Refusal | null {
  if (actor.kind === "child") return "child_cannot_run_assessments";
  if (track === "personality" && actor.orgSlug === "sales") return "not_on_sales_board";
  return null;
}

export function parseTrack(body: unknown): TrackId | null {
  if (typeof body !== "object" || body === null) return null;
  const track = Object.getOwnPropertyDescriptor(body, "track")?.value;
  return isTrackId(track) ? track : null;
}

export function parseAnswer(body: unknown): Answer | null {
  if (typeof body !== "object" || body === null) return null;
  const key = Object.getOwnPropertyDescriptor(body, "key")?.value;
  const value = Object.getOwnPropertyDescriptor(body, "value")?.value;
  if (typeof key !== "string" || typeof value !== "number" || !Number.isInteger(value)) return null;
  return { key, value };
}

/** Stored answers are trusted only after they match the track bank. */
export function readAnswers(track: TrackDef, raw: unknown): Answer[] | null {
  if (!Array.isArray(raw)) return null;
  const byKey = new Map(track.items.map((item) => [item.key, item]));
  const seen = new Set<string>();
  const out: Answer[] = [];
  for (const entry of raw) {
    const answer = parseAnswer(entry);
    const item = answer ? byKey.get(answer.key) : undefined;
    if (!answer || !item || seen.has(answer.key)) return null;
    if (!item.choices.some((choice) => choice.value === answer.value)) return null;
    seen.add(answer.key);
    out.push(answer);
  }
  return out;
}

export function readPrior(track: TrackDef, raw: unknown): Prior | null {
  if (typeof raw !== "object" || raw === null) return null;
  const mean = Object.getOwnPropertyDescriptor(raw, "mean")?.value;
  const scale = Object.getOwnPropertyDescriptor(raw, "scale")?.value;
  if (!Array.isArray(mean) || mean.length !== track.dims.length) return null;
  if (!mean.every((value) => typeof value === "number" && Number.isFinite(value))) return null;
  if (typeof scale !== "number" || !(scale > 0 && scale <= 1)) return null;
  return { mean, scale };
}

const SEED_SCALE = 0.5;

/**
 * A Field Pattern Bearing (0..100 per dim, 50 neutral) pre-seeds the Personality prior.
 * It narrows where the track starts; the six-answer floor still applies before any lock.
 */
export function priorFromBearing(track: TrackDef, dims: unknown): Prior | null {
  if (typeof dims !== "object" || dims === null) return null;
  const mean: number[] = [];
  for (const dim of track.dims) {
    const value = Object.getOwnPropertyDescriptor(dims, dim)?.value;
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    mean.push(Math.max(-2, Math.min(2, (value - 50) / 25)));
  }
  return { mean, scale: SEED_SCALE };
}

/** Canonical text hashed when raw answers are dropped. */
export function answersDigestInput(bankVersion: string, answers: readonly Answer[]) {
  return JSON.stringify({ bankVersion, answers: answers.map((answer) => [answer.key, answer.value]) });
}

export function isExpired(updatedAt: Date, now: Date) {
  return now.getTime() - updatedAt.getTime() > RETENTION_DAYS * DAY;
}

/**
 * A retried answer that is already the last one stored is a repeat, not a conflict.
 * Returns which of the three cases applies.
 */
export function answerFit(state: RunState, stored: readonly Answer[], answer: Answer): "accept" | "repeat" | "reject" {
  if (acceptsAnswer(state, answer)) return "accept";
  const last = stored[stored.length - 1];
  return last && last.key === answer.key && last.value === answer.value ? "repeat" : "reject";
}

export type PlacementView = {
  taxonomy: TaxonomyId;
  label: string;
  category: string;
  categoryLabel: string;
  confidencePct: number;
  state: "open" | "locked" | "unsettled";
};

export type RunView = {
  runId: string;
  track: TrackId;
  status: RunStatus;
  answered: number;
  ceiling: number;
  next: { key: string; prompt: string; choices: { label: string; value: number }[] } | null;
  meter: { progress: number; taxonomies: { taxonomy: TaxonomyId; progress: number; settled: boolean }[] };
  placements: PlacementView[];
};

export function pct(confidence: number) {
  return Math.round(confidence * 1000) / 10;
}

function placementView(placement: Placement & { kind: PlacementView["state"] }): PlacementView {
  return {
    taxonomy: placement.taxonomy,
    label: placement.taxonomyLabel,
    category: placement.category,
    categoryLabel: placement.categoryLabel,
    confidencePct: pct(placement.confidence),
    state: placement.kind,
  };
}

export function runView(track: TrackDef, runId: string, state: RunState): RunView {
  return {
    runId,
    track: track.id,
    status: state.kind === "asking" ? "in_progress" : state.outcome,
    answered: state.answered,
    ceiling: track.ceiling,
    next:
      state.kind === "asking"
        ? { key: state.next.key, prompt: state.next.prompt, choices: state.next.choices.map((c) => ({ ...c })) }
        : null,
    meter: trackMeter(state),
    placements: state.placements.map(placementView),
  };
}

export type StoredPlacement = {
  track: TrackId;
  taxonomy: string;
  category: string;
  confidencePct: number;
  locked: boolean;
  unsettled: boolean;
};

export type Audience = "self" | "peer" | "public";

/**
 * Self and signed-in peers see every placement. The public cut is the full set of
 * Personality placements (Ben, CDM CONFIRM) and nothing from Skills or Profile.
 */
export function audienceCut(audience: Audience, placements: readonly StoredPlacement[]): StoredPlacement[] {
  if (audience === "public") return placements.filter((placement) => placement.track === "personality");
  return [...placements];
}

export function firstIncompleteTrack(done: Partial<Record<TrackId, boolean>>): TrackId {
  return TRACK_IDS.find((track) => !done[track]) ?? TRACK_IDS[0];
}
