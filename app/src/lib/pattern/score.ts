import {
  BEARING_DIMS,
  type BearingDim,
  type InstrumentItem,
  itemsForSubset,
} from "./items";

export const LIKERT_MIN = 1;
export const LIKERT_MAX = 5;
export const NUDGE_MIX = 0.15;
export const QUIZ_NUDGE = 0.05;
export const NARRATIVE_MOVE = 8;

export type BearingMap = Record<BearingDim, number>;

export type PatternResult = {
  bearing: BearingMap;
  correspondence: ReturnType<typeof correspondenceFrom>;
  primary: BearingDim;
  secondary: BearingDim;
  narratives: Record<string, string>;
};

function emptyBearing(): BearingMap {
  return {
    drive: 50,
    harmony: 50,
    structure: 50,
    pace: 50,
    abstraction: 50,
    challenge: 50,
    duty: 50,
    expression: 50,
  };
}

function dimExtent(items: InstrumentItem[], dim: BearingDim) {
  return items.reduce((n, item) => n + 2 * Math.abs(item.weights[dim] ?? 0), 0);
}

export function scoreAnswers(
  answers: Record<string, number>,
  subset: "adult" | "child",
): PatternResult {
  const items = itemsForSubset(subset);
  const raw: Record<BearingDim, number> = {
    drive: 0, harmony: 0, structure: 0, pace: 0,
    abstraction: 0, challenge: 0, duty: 0, expression: 0,
  };
  for (const item of items) {
    const a = answers[item.key];
    if (typeof a !== "number") continue;
    const clipped = Math.min(LIKERT_MAX, Math.max(LIKERT_MIN, a));
    const centered = clipped - 3;
    for (const dim of BEARING_DIMS) {
      raw[dim] += centered * (item.weights[dim] ?? 0);
    }
  }
  const bearing = emptyBearing();
  for (const dim of BEARING_DIMS) {
    const ext = dimExtent(items, dim) || 1;
    const min = -ext;
    const max = ext;
    bearing[dim] = clamp100(((raw[dim] - min) / (max - min)) * 100);
  }
  return finish(bearing);
}

export function clamp100(n: number) {
  return Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
}

export function ranked(bearing: BearingMap): BearingDim[] {
  return [...BEARING_DIMS].sort((a, b) => bearing[b] - bearing[a] || a.localeCompare(b));
}

function softmax(pairs: Record<string, number>) {
  const keys = Object.keys(pairs);
  const max = Math.max(...keys.map((k) => pairs[k]));
  const exps = Object.fromEntries(keys.map((k) => [k, Math.exp(pairs[k] - max)]));
  const sum = keys.reduce((n, k) => n + exps[k], 0);
  return Object.fromEntries(keys.map((k) => [k, Math.round((exps[k] / sum) * 1000) / 1000]));
}

/**
 * Unofficial probability maps from Bearing.
 * Product copy never uses the names of other instruments.
 */
export function correspondenceFrom(bearing: BearingMap) {
  const outward = (bearing.expression + bearing.drive) / 2;
  const inward = (100 - bearing.expression + 50) / 1.5;
  const concrete = 100 - bearing.abstraction;
  const model = bearing.abstraction;
  const task = (bearing.challenge + bearing.duty) / 2;
  const human = bearing.harmony;
  const planned = bearing.structure;
  const adapting = bearing.pace;

  const energy = outward >= inward ? "O" : "I";
  const intake = concrete >= model ? "C" : "M";
  const decide = task >= human ? "T" : "H";
  const close = planned >= adapting ? "P" : "A";
  const typeCode = `${energy}${intake}${decide}${close}`;

  const typeLogits: Record<string, number> = {};
  for (const e of ["O", "I"]) {
    for (const i of ["C", "M"]) {
      for (const d of ["T", "H"]) {
        for (const c of ["P", "A"]) {
          const code = `${e}${i}${d}${c}`;
          typeLogits[code] =
            (e === "O" ? outward : inward) +
            (i === "C" ? concrete : model) +
            (d === "T" ? task : human) +
            (c === "P" ? planned : adapting);
        }
      }
    }
  }

  return {
    note: "Field Pattern estimates. Not an official result from another instrument.",
    imported: false,
    nine_patterns: softmax({
      p1: bearing.duty * 0.6 + bearing.structure * 0.4,
      p2: bearing.harmony * 0.7 + bearing.duty * 0.3,
      p3: bearing.drive * 0.6 + bearing.expression * 0.4,
      p4: bearing.abstraction * 0.5 + bearing.harmony * 0.5,
      p5: bearing.abstraction * 0.6 + bearing.structure * 0.4,
      p6: bearing.duty * 0.5 + bearing.harmony * 0.5,
      p7: bearing.pace * 0.5 + bearing.drive * 0.3 + bearing.expression * 0.2,
      p8: bearing.challenge * 0.7 + bearing.drive * 0.3,
      p9: bearing.harmony * 0.5 + (100 - bearing.pace) * 0.5,
    }),
    type_codes: softmax(typeLogits),
    leading_type_code: typeCode,
    influence: softmax({
      direct: (bearing.drive + bearing.challenge) / 2,
      warm: (bearing.harmony + bearing.expression) / 2,
      steady: (bearing.duty + (100 - bearing.pace)) / 2,
      precise: (bearing.structure + bearing.abstraction) / 2,
    }),
    clusters: softmax({
      drive: bearing.drive,
      harmony: bearing.harmony,
      structure: bearing.structure,
      pace: bearing.pace,
      abstraction: bearing.abstraction,
      challenge: bearing.challenge,
      duty: bearing.duty,
      expression: bearing.expression,
    }),
  };
}

function narrativesFrom(b: BearingMap): Record<string, string> {
  const learn = b.abstraction < 45
    ? "Start with a concrete example, then name the rule."
    : b.abstraction > 60
      ? "Give the model first. A story is optional."
      : "Pair one example with one rule on the same station.";
  const approach = b.drive > 60
    ? "Start the work. A short first pass beats more planning."
    : b.structure > 60
      ? "Name the steps and what done looks like, then begin."
      : "Pick one job and write the outcome in a sentence before you touch a tool.";
  const conflict = b.challenge > 60
    ? "Treat disagreement as information. Say the hard sentence in the room."
    : b.harmony > 60
      ? "Keep the people in the room. Put the hard note in writing if the live version shuts someone down."
      : "Name the leftover human step. Do not smooth over a miss.";
  const feedback = b.challenge < 45 && b.harmony > 55
    ? "Private written feedback you can reread. Not a live debrief first."
    : b.expression > 60
      ? "Talk it through, or a short Loom, then keep the one change for the next run."
      : "Want the specific fix. A quiz is the next brief, not a verdict.";
  const group = b.harmony > 55
    ? "Notice who has not spoken. Name your job so the room does not have to guess."
    : b.drive > 60
      ? "If no one leads, you will. Leave a trail so the next person can pick up."
      : "Sit in the staff thread. You still hold send and pay.";
  const paceLine = b.pace > 60 ? " Short sessions. Build in a walk-away." : "";
  const order = ranked(b);
  const working_title = `${cap(order[0])} / ${cap(order[1])}`;
  return {
    how_you_learn: learn,
    how_you_approach: approach + paceLine,
    how_you_handle_conflict: conflict,
    how_you_take_feedback: feedback,
    how_you_show_up_in_a_group: group,
    working_title,
  };
}

function cap(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function finish(bearing: BearingMap): PatternResult {
  const order = ranked(bearing);
  return {
    bearing,
    correspondence: correspondenceFrom(bearing),
    primary: order[0],
    secondary: order[1],
    narratives: narrativesFrom(bearing),
  };
}

export function nudgeBearing(
  current: BearingMap,
  inferred: BearingMap,
  mix = NUDGE_MIX,
): PatternResult {
  const next = emptyBearing();
  for (const dim of BEARING_DIMS) {
    next[dim] = clamp100(current[dim] * (1 - mix) + inferred[dim] * mix);
  }
  return finish(next);
}

export function inferBearingFromTranscript(text: string): BearingMap {
  const lower = text.toLowerCase();
  const bags: Record<BearingDim, string[]> = {
    drive: ["start", "lead", "first", "go", "push", "speed"],
    harmony: ["people", "room", "together", "kind", "soft", "notice"],
    structure: ["checklist", "steps", "done", "order", "notes", "standard"],
    pace: ["short", "break", "burst", "walk", "session"],
    abstraction: ["model", "system", "diagram", "rule", "principle"],
    challenge: ["disagree", "hard", "tense", "feedback", "argument"],
    duty: ["commitment", "responsible", "required", "finish", "score"],
    expression: ["talk", "out loud", "explain", "teach", "loom", "write"],
  };
  const next = emptyBearing();
  for (const dim of BEARING_DIMS) {
    const hits = bags[dim].reduce((n, w) => n + (lower.includes(w) ? 1 : 0), 0);
    next[dim] = clamp100(50 + hits * 8);
  }
  return next;
}

export function narrativeKeysMoved(
  prev: BearingMap,
  next: BearingMap,
) {
  return BEARING_DIMS.filter((dim) => Math.abs(next[dim] - prev[dim]) >= NARRATIVE_MOVE);
}

export function mergeNarratives(
  prev: Record<string, string>,
  next: PatternResult,
  prevBearing: BearingMap,
) {
  const moved = new Set(narrativeKeysMoved(prevBearing, next.bearing));
  if (moved.size === 0) return { ...prev, working_title: next.narratives.working_title };
  return next.narratives;
}

export function asBearing(value: unknown): BearingMap {
  const raw = value && typeof value === "object" ? (value as Record<string, number>) : {};
  const next = emptyBearing();
  for (const dim of BEARING_DIMS) {
    if (typeof raw[dim] === "number") next[dim] = clamp100(raw[dim]);
  }
  return next;
}

export function emptyCorrespondence(): Record<string, unknown> {
  return correspondenceFrom(emptyBearing());
}
