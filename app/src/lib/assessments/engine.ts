import { backward, cholesky, dot, inverseFromCholesky, matVec, normalDraws, solve, sub, type Mat, type Vec } from "./linalg.ts";
import {
  LOCK_CONFIDENCE,
  MIN_ANSWERS,
  type Category,
  type TaxonomyId,
  type TrackDef,
  type TrackItem,
} from "./tracks.ts";

export type Answer = { key: string; value: number };

/** Prior mean on the track dims, and how much of the default prior variance remains. */
export type Prior = { mean: readonly number[]; scale: number };

export type Placement = {
  taxonomy: TaxonomyId;
  taxonomyLabel: string;
  category: string;
  categoryLabel: string;
  /** Posterior probability of `category`, 0..1. */
  confidence: number;
  /** Answers so far that inform this taxonomy. */
  answered: number;
};

export type OpenPlacement = Placement & { kind: "open" };
export type LockedPlacement = Placement & { kind: "locked"; atAnswer: number };
export type UnsettledPlacement = Placement & { kind: "unsettled" };

export type RunState =
  | {
      kind: "asking";
      next: TrackItem;
      answered: number;
      placements: (OpenPlacement | LockedPlacement)[];
    }
  | {
      kind: "finished";
      outcome: "complete" | "ceiling_unsettled";
      answered: number;
      placements: (LockedPlacement | UnsettledPlacement)[];
    };

const DRAW_PAIRS = 512;
const DRAW_SEED = 0x5eed;
const drawCache = new Map<number, number[][]>();

function draws(dims: number) {
  let cached = drawCache.get(dims);
  if (!cached) {
    cached = normalDraws(dims, DRAW_PAIRS, DRAW_SEED);
    drawCache.set(dims, cached);
  }
  return cached;
}

export function neutralPrior(track: TrackDef): Prior {
  return { mean: track.dims.map(() => 0), scale: 1 };
}

function priorCovariance(track: TrackDef, scale: number): number[][] {
  return track.dims.map((_, i) =>
    track.dims.map((__, j) => scale * (i === j ? 1 : track.priorCorrelation)),
  );
}

/** Maps a choice value onto [-1, 1] across the item's own choice range. */
function centred(item: TrackItem, value: number) {
  const values = item.choices.map((choice) => choice.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return (2 * (value - lo)) / (hi - lo) - 1;
}

function informs(item: TrackItem, categories: readonly Category[]) {
  const base = categories[0].weights;
  return categories.some((category) => Math.abs(dot(sub(category.weights, base), item.slope)) > 1e-9);
}

function logits(categories: readonly Category[], theta: Vec) {
  return categories.map((category) => dot(category.weights, theta) + category.bias);
}

function argmax(values: readonly number[]) {
  let best = 0;
  for (let i = 1; i < values.length; i += 1) if (values[i] > values[best]) best = i;
  return best;
}

type Posterior = { mean: number[]; factor: number[][] };

/** Share of posterior draws in which each category wins. */
function probabilities(categories: readonly Category[], posterior: Posterior, offsets: readonly number[][]) {
  const wins = new Array<number>(categories.length).fill(0);
  for (const offset of offsets) {
    const theta = posterior.mean.map((value, i) => value + offset[i]);
    wins[argmax(logits(categories, theta))] += 1;
  }
  return wins.map((count) => count / offsets.length);
}

/** Categories ranked by probability, ties broken by the logit at the posterior mean. */
function ranked(categories: readonly Category[], probs: readonly number[], mean: Vec) {
  const atMean = logits(categories, mean);
  return categories
    .map((_, i) => i)
    .sort((a, b) => probs[b] - probs[a] || atMean[b] - atMean[a] || a - b);
}

function placementOf(
  taxonomy: TrackDef["taxonomies"][number],
  probs: readonly number[],
  mean: Vec,
  answered: number,
): Placement {
  const top = ranked(taxonomy.categories, probs, mean)[0];
  const category = taxonomy.categories[top];
  return {
    taxonomy: taxonomy.id,
    taxonomyLabel: taxonomy.label,
    category: category.id,
    categoryLabel: category.label,
    confidence: probs[top],
    answered,
  };
}

/**
 * Share of the variance between the two leading categories that one more answer to `item` removes.
 * The posterior covariance shrinks the same way whatever the answer, so this needs no answer.
 */
function separation(item: TrackItem, direction: Vec, covariance: Mat, noise: number) {
  const spread = dot(direction, matVec(covariance, direction));
  if (spread <= 1e-12) return 0;
  const covItem = matVec(covariance, item.slope);
  const along = dot(direction, covItem);
  return (along * along) / ((noise * noise + dot(item.slope, covItem)) * spread);
}

/**
 * Replays the answers in order. A taxonomy locks the first time its top category reaches
 * LOCK_CONFIDENCE with at least MIN_ANSWERS informing answers, and later answers never move it.
 * The same prior and answers always give the same state, so a run resumes on any device.
 */
export function evaluate(track: TrackDef, prior: Prior, answers: readonly Answer[]): RunState {
  const byKey = new Map(track.items.map((item) => [item.key, item]));
  const noiseVar = track.noise * track.noise;
  const priorFactor = cholesky(priorCovariance(track, prior.scale));
  const precision = inverseFromCholesky(priorFactor);
  const info = matVec(precision, prior.mean);
  const informed = new Map<TaxonomyId, number>(track.taxonomies.map((t) => [t.id, 0]));
  const locked = new Map<TaxonomyId, LockedPlacement>();
  const unit = draws(track.dims.length);

  let posterior: Posterior = { mean: [...prior.mean], factor: cholesky(precision) };
  const offsetsFor = (factor: Mat) => unit.map((z) => backward(factor, z));

  answers.forEach((answer, index) => {
    const item = byKey.get(answer.key);
    if (!item) throw new Error(`assessment_item_unknown:${answer.key}`);
    const y = centred(item, answer.value);
    for (let i = 0; i < item.slope.length; i += 1) {
      info[i] += (item.slope[i] * y) / noiseVar;
      for (let j = 0; j < item.slope.length; j += 1) {
        precision[i][j] += (item.slope[i] * item.slope[j]) / noiseVar;
      }
    }
    const factor = cholesky(precision);
    posterior = { mean: solve(factor, info), factor };
    let offsets: number[][] | null = null;
    for (const taxonomy of track.taxonomies) {
      if (locked.has(taxonomy.id)) continue;
      const count = (informed.get(taxonomy.id) ?? 0) + (informs(item, taxonomy.categories) ? 1 : 0);
      informed.set(taxonomy.id, count);
      if (count < MIN_ANSWERS) continue;
      offsets ??= offsetsFor(factor);
      const placement = placementOf(taxonomy, probabilities(taxonomy.categories, posterior, offsets), posterior.mean, count);
      if (placement.confidence >= LOCK_CONFIDENCE) {
        locked.set(taxonomy.id, { ...placement, kind: "locked", atAnswer: index + 1 });
      }
    }
  });

  const offsets = offsetsFor(posterior.factor);
  const live = new Map(
    track.taxonomies
      .filter((taxonomy) => !locked.has(taxonomy.id))
      .map((taxonomy) => [taxonomy.id, probabilities(taxonomy.categories, posterior, offsets)]),
  );
  const current = (taxonomy: TrackDef["taxonomies"][number]): Placement =>
    placementOf(taxonomy, live.get(taxonomy.id) ?? [], posterior.mean, informed.get(taxonomy.id) ?? 0);

  const finish = (outcome: "complete" | "ceiling_unsettled"): RunState => ({
    kind: "finished",
    outcome,
    answered: answers.length,
    placements: track.taxonomies.map(
      (taxonomy) => locked.get(taxonomy.id) ?? { ...current(taxonomy), kind: "unsettled" },
    ),
  });

  if (locked.size === track.taxonomies.length) return finish("complete");
  if (answers.length >= track.ceiling) return finish("ceiling_unsettled");

  const covariance = inverseFromCholesky(posterior.factor);
  const directions = track.taxonomies
    .filter((taxonomy) => !locked.has(taxonomy.id))
    .map((taxonomy) => {
      const order = ranked(taxonomy.categories, live.get(taxonomy.id) ?? [], posterior.mean);
      return sub(taxonomy.categories[order[0]].weights, taxonomy.categories[order[1]].weights);
    });
  const asked = new Set(answers.map((answer) => answer.key));
  let next: TrackItem | null = null;
  let best = 1e-6;
  for (const item of track.items) {
    if (asked.has(item.key)) continue;
    const score = directions.reduce((sum, direction) => sum + separation(item, direction, covariance, track.noise), 0);
    if (score > best) {
      best = score;
      next = item;
    }
  }
  if (!next) return finish("ceiling_unsettled");

  return {
    kind: "asking",
    next,
    answered: answers.length,
    placements: track.taxonomies.map(
      (taxonomy) => locked.get(taxonomy.id) ?? { ...current(taxonomy), kind: "open" },
    ),
  };
}

/** The answer the server accepts next: the asked item and one of its choice values. */
export function acceptsAnswer(state: RunState, answer: Answer): boolean {
  return (
    state.kind === "asking" &&
    state.next.key === answer.key &&
    state.next.choices.some((choice) => choice.value === answer.value)
  );
}

export type TaxonomyMeter = { taxonomy: TaxonomyId; progress: number; settled: boolean };

/**
 * Confidence progress toward the lock line, not a question count. An open taxonomy stops
 * just short of full so the bar never shows a lock that has not happened.
 */
export function trackMeter(state: RunState): { progress: number; taxonomies: TaxonomyMeter[] } {
  const taxonomies = state.placements.map((placement) => ({
    taxonomy: placement.taxonomy,
    settled: placement.kind !== "open",
    progress: placement.kind === "open" ? Math.min(0.99, placement.confidence / LOCK_CONFIDENCE) : 1,
  }));
  const progress = taxonomies.reduce((sum, t) => sum + t.progress, 0) / taxonomies.length;
  return { progress, taxonomies };
}
