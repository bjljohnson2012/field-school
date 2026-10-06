// Simulates respondents drawn from each track's prior, runs the real engine to the end,
// and reports how many questions it asked and how often a locked placement was right.
// Usage: node --experimental-strip-types scripts/assessment-calibration.mjs [respondents]
import { evaluate, neutralPrior } from "../src/lib/assessments/engine.ts";
import { cholesky, dot, matVec, normalDraws } from "../src/lib/assessments/linalg.ts";
import { TRACK_IDS, trackDef } from "../src/lib/assessments/tracks.ts";

const respondents = Number(process.argv[2] ?? 200);

function gaussian(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const u = Math.max(state / 4294967296, 1e-12);
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.sqrt(-2 * Math.log(u)) * Math.cos((2 * Math.PI * state) / 4294967296);
  };
}

function answerFor(item, theta, noise, rand) {
  const values = item.choices.map((c) => c.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const y = Math.max(-1, Math.min(1, dot(item.slope, theta) + noise * rand()));
  return Math.round(lo + ((y + 1) / 2) * (hi - lo));
}

export function calibrate(trackId, count) {
  const track = trackDef(trackId);
  const prior = neutralPrior(track);
  const cov = track.dims.map((_, i) => track.dims.map((__, j) => (i === j ? 1 : track.priorCorrelation)));
  const factor = cholesky(cov);
  const truths = normalDraws(track.dims.length, Math.ceil(count / 2), 0xc0ffee).slice(0, count).map((z) => matVec(factor, z));
  const rand = gaussian(7);
  const per = new Map(track.taxonomies.map((t) => [t.id, { locked: 0, right: 0, unsettledRight: 0, unsettled: 0 }]));
  let questions = 0;
  let complete = 0;
  for (const theta of truths) {
    const answers = [];
    let state = evaluate(track, prior, answers);
    while (state.kind === "asking") {
      answers.push({ key: state.next.key, value: answerFor(state.next, theta, track.noise, rand) });
      state = evaluate(track, prior, answers);
    }
    questions += state.answered;
    if (state.outcome === "complete") complete += 1;
    for (const placement of state.placements) {
      const taxonomy = track.taxonomies.find((t) => t.id === placement.taxonomy);
      const scores = taxonomy.categories.map((c) => dot(c.weights, theta) + c.bias);
      const truth = taxonomy.categories[scores.indexOf(Math.max(...scores))].id;
      const row = per.get(placement.taxonomy);
      if (placement.kind === "locked") {
        row.locked += 1;
        if (placement.category === truth) row.right += 1;
      } else {
        row.unsettled += 1;
        if (placement.category === truth) row.unsettledRight += 1;
      }
    }
  }
  return {
    track: trackId,
    respondents: count,
    meanQuestions: Math.round((questions / count) * 10) / 10,
    ceiling: track.ceiling,
    allLocked: Math.round((complete / count) * 100),
    taxonomies: [...per.entries()].map(([id, row]) => ({
      id,
      lockedPct: Math.round((row.locked / count) * 100),
      lockAccuracyPct: row.locked ? Math.round((row.right / row.locked) * 100) : null,
      unsettledAccuracyPct: row.unsettled ? Math.round((row.unsettledRight / row.unsettled) * 100) : null,
    })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const id of TRACK_IDS) console.log(JSON.stringify(calibrate(id, respondents)));
}
