import { BEARING_DIMS, loadPinnedBank } from "../pattern/load-bank.ts";
import { INTEL_DIMS, SKILL_DIMS, intelligenceBank, skillBank, type BankItem, type Choice } from "./banks.ts";

export const TRACK_IDS = ["personality", "skills", "profile"] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export const TAXONOMY_IDS = [
  "enneagram",
  "disc",
  "mbti",
  "field_pattern",
  "skill_band",
  "skill_cluster",
  "intelligence_lead",
  "notice_band",
  "decide_band",
  "learn_band",
] as const;
export type TaxonomyId = (typeof TAXONOMY_IDS)[number];

export type AdultGateId = "G-personality" | "G-skills" | "G-other";

/** A category wins where `weights · θ + bias` is largest. Ordinal bands are argmax-linear too. */
export type Category = { id: string; label: string; weights: readonly number[]; bias: number };

export type Taxonomy = {
  id: TaxonomyId;
  label: string;
  categories: readonly Category[];
};

export type TrackItem = {
  key: string;
  prompt: string;
  choices: readonly Choice[];
  /** Loadings scaled to unit length times the track's slope. */
  slope: readonly number[];
};

export type TrackDef = {
  id: TrackId;
  label: string;
  gate: AdultGateId;
  dims: readonly string[];
  items: readonly TrackItem[];
  taxonomies: readonly Taxonomy[];
  ceiling: number;
  /** Prior covariance before any answer: unit variance with this correlation between dims. */
  priorCorrelation: number;
  noise: number;
  bankVersion: string;
};

export const LOCK_CONFIDENCE = 0.75;
export const MIN_ANSWERS = 6;
export const CEILINGS: Record<TrackId, number> = { personality: 50, skills: 24, profile: 24 };

const LIKERT: Choice[] = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

function scaled(loadings: readonly number[], slope: number): number[] {
  const norm = Math.hypot(...loadings) || 1;
  return loadings.map((value) => (value / norm) * slope);
}

function toItems(bank: readonly BankItem[], slope: number): TrackItem[] {
  return bank.map((item) => ({
    key: item.key,
    prompt: item.prompt,
    choices: item.choices,
    slope: scaled(item.loadings, slope),
  }));
}

function vector(dims: readonly string[], parts: Record<string, number>): number[] {
  return dims.map((dim) => parts[dim] ?? 0);
}

function unitCategories(dims: readonly string[], labels: Record<string, string>): Category[] {
  return dims.map((dim) => ({ id: dim, label: labels[dim], weights: vector(dims, { [dim]: 1 }), bias: 0 }));
}

/**
 * Ordinal bands on one direction `u · θ`, cut at increasing `cuts`.
 * Band k has logit k·(u·θ) − (c₁ + … + c_k), so band k wins exactly between c_k and c_{k+1}.
 */
function bandCategories(
  direction: readonly number[],
  cuts: readonly number[],
  bands: readonly { id: string; label: string }[],
): Category[] {
  let bias = 0;
  return bands.map((band, k) => {
    if (k > 0) bias -= cuts[k - 1];
    return { id: band.id, label: band.label, weights: direction.map((value) => value * k), bias };
  });
}

const BEARING_LABEL: Record<string, string> = {
  drive: "Drive",
  harmony: "Harmony",
  structure: "Structure",
  pace: "Pace",
  abstraction: "Abstraction",
  challenge: "Challenge",
  duty: "Duty",
  expression: "Expression",
};

/** Same blends as Field Pattern's nine-pattern estimate, centred on the neutral Bearing. */
const NINE: Record<string, Record<string, number>> = {
  "1": { duty: 0.6, structure: 0.4 },
  "2": { harmony: 0.7, duty: 0.3 },
  "3": { drive: 0.6, expression: 0.4 },
  "4": { abstraction: 0.5, harmony: 0.5 },
  "5": { abstraction: 0.6, structure: 0.4 },
  "6": { duty: 0.5, harmony: 0.5 },
  "7": { pace: 0.5, drive: 0.3, expression: 0.2 },
  "8": { challenge: 0.7, drive: 0.3 },
  "9": { harmony: 0.5, pace: -0.5 },
};

/** Same blends as Field Pattern's influence estimate. */
const FOUR: Record<string, { label: string; parts: Record<string, number> }> = {
  D: { label: "D · Direct", parts: { drive: 0.5, challenge: 0.5 } },
  I: { label: "I · Warm", parts: { harmony: 0.5, expression: 0.5 } },
  S: { label: "S · Steady", parts: { duty: 0.5, pace: -0.5 } },
  C: { label: "C · Precise", parts: { structure: 0.5, abstraction: 0.5 } },
};

/** Four letter axes; a positive score picks the first letter. Mirrors Field Pattern's type-code blend. */
const LETTER_AXES: { letters: [string, string]; parts: Record<string, number> }[] = [
  { letters: ["E", "I"], parts: { expression: 0.5, drive: 0.5 } },
  { letters: ["N", "S"], parts: { abstraction: 1 } },
  { letters: ["T", "F"], parts: { challenge: 0.5, duty: 0.5, harmony: -1 } },
  { letters: ["J", "P"], parts: { structure: 1, pace: -1 } },
];

function fourLetterCategories(dims: readonly string[]): Category[] {
  const out: Category[] = [];
  for (let code = 0; code < 16; code += 1) {
    let id = "";
    let weights = dims.map(() => 0);
    LETTER_AXES.forEach((axis, i) => {
      const first = ((code >> (3 - i)) & 1) === 0;
      id += first ? axis.letters[0] : axis.letters[1];
      const sign = first ? 0.5 : -0.5;
      const axisVector = vector(dims, axis.parts);
      weights = weights.map((value, d) => value + sign * axisVector[d]);
    });
    out.push({ id, label: id, weights, bias: 0 });
  }
  return out;
}

const SKILL_BANDS = [
  { id: "watcher", label: "Watcher" },
  { id: "operator", label: "Operator" },
  { id: "crew_lead", label: "Crew lead" },
  { id: "principal", label: "Principal" },
];

const INTEL_BANDS = [
  { id: "warming", label: "Warming" },
  { id: "working", label: "Working" },
  { id: "sharp", label: "Sharp" },
];

/** Answer y in [-1, 1] is modelled as slope · θ + noise. */
const SLOPE = 0.6;
const NOISE = 0.45;

/**
 * Tools Skill bands cut the average answer at 10/6, 16/6 and 21/6 of a 1..4 scale.
 * On the centred [-1, 1] scale that is y = −0.556, 0.111, 0.667; divided by the slope gives θ cuts.
 */
const SKILL_CUTS = [-0.556, 0.111, 0.667].map((y) => y / SLOPE);
/** Tools Intelligence bands: warming below 5/8, sharp from 7/8 of a 1..4 axis. */
const INTEL_CUTS = [0, 0.667].map((y) => y / SLOPE);

const INTEL_BAND: Record<(typeof INTEL_DIMS)[number], { id: TaxonomyId; label: string }> = {
  notice: { id: "notice_band", label: "Notice band" },
  decide: { id: "decide_band", label: "Decide band" },
  learn: { id: "learn_band", label: "Learn band" },
};

let cache: Record<TrackId, TrackDef> | null = null;

function build(): Record<TrackId, TrackDef> {
  const bearing = [...BEARING_DIMS];
  const personalityItems: TrackItem[] = loadPinnedBank().map((item) => ({
    key: item.key,
    prompt: item.prompt,
    choices: LIKERT,
    slope: scaled(bearing.map((dim) => item.weights[dim] ?? 0), SLOPE),
  }));
  const skillDims = [...SKILL_DIMS];
  const intelDims = [...INTEL_DIMS];
  const mean = skillDims.map(() => 1 / skillDims.length);
  return {
    personality: {
      id: "personality",
      label: "Personality",
      gate: "G-personality",
      dims: bearing,
      items: personalityItems,
      taxonomies: [
        {
          id: "enneagram",
          label: "Enneagram-style type",
          categories: Object.entries(NINE).map(([id, parts]) => ({ id, label: `Type ${id}`, weights: vector(bearing, parts), bias: 0 })),
        },
        {
          id: "disc",
          label: "DISC-style style",
          categories: Object.entries(FOUR).map(([id, four]) => ({ id, label: four.label, weights: vector(bearing, four.parts), bias: 0 })),
        },
        { id: "mbti", label: "MBTI-style four-letter type", categories: fourLetterCategories(bearing) },
        { id: "field_pattern", label: "Field Pattern Bearing", categories: unitCategories(bearing, BEARING_LABEL) },
      ],
      ceiling: CEILINGS.personality,
      priorCorrelation: 0,
      noise: NOISE,
      bankVersion: "fp-50-v1+wizard-1",
    },
    skills: {
      id: "skills",
      label: "Skills",
      gate: "G-skills",
      dims: skillDims,
      items: toItems(skillBank(), SLOPE),
      taxonomies: [
        { id: "skill_band", label: "Skill band", categories: bandCategories(mean, SKILL_CUTS, SKILL_BANDS) },
        {
          id: "skill_cluster",
          label: "Strongest skill cluster",
          categories: unitCategories(skillDims, {
            briefs: "Briefs",
            systems: "Systems and logins",
            ai_crew: "AI crew",
            shipping: "Shipping",
          }),
        },
      ],
      ceiling: CEILINGS.skills,
      priorCorrelation: 0.6,
      noise: NOISE,
      bankVersion: "skill-wizard-1",
    },
    profile: {
      id: "profile",
      label: "Profile",
      gate: "G-other",
      dims: intelDims,
      items: toItems(intelligenceBank(), SLOPE),
      taxonomies: [
        {
          id: "intelligence_lead",
          label: "Lead axis",
          categories: unitCategories(intelDims, { notice: "Notice", decide: "Decide", learn: "Learn" }),
        },
        ...INTEL_DIMS.map((dim) => ({
          id: INTEL_BAND[dim].id,
          label: INTEL_BAND[dim].label,
          categories: bandCategories(vector(intelDims, { [dim]: 1 }), INTEL_CUTS, INTEL_BANDS),
        })),
      ],
      ceiling: CEILINGS.profile,
      priorCorrelation: 0.3,
      noise: NOISE,
      bankVersion: "intelligence-wizard-1",
    },
  };
}

export function trackDef(id: TrackId): TrackDef {
  cache ??= build();
  return cache[id];
}

export function isTrackId(value: unknown): value is TrackId {
  return TRACK_IDS.some((id) => id === value);
}
