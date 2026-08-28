import assert from "node:assert/strict";

const dash = (length, drawn) => {
  const amount = Math.max(0, Math.min(1, drawn));
  return {strokeDasharray: `${length}`, strokeDashoffset: length * (1 - amount)};
};

const along = (drawn, stops) => {
  if (stops.length === 0) {
    return 0;
  }
  if (stops.length === 1) {
    return stops[0];
  }
  const t = Math.max(0, Math.min(1, drawn)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(t));
  const local = t - i;
  return stops[i] + (stops[i + 1] - stops[i]) * local;
};

assert.equal(dash(100, 0).strokeDashoffset, 100);
assert.equal(dash(100, 1).strokeDashoffset, 0);
assert.equal(dash(100, 0.5).strokeDashoffset, 50);
assert.equal(along(0, [10, 20, 30]), 10);
assert.equal(along(1, [10, 20, 30]), 30);
assert.equal(along(0.5, [10, 30]), 20);

const FPS = 30;
const MIN_HOLD_MS = 3000;
const DROP_RETURN_LEAD_FRAMES = 22;
const PAPER_LEAVE_FRAMES = 16;
const WAIT_CLEAR_MS = ((DROP_RETURN_LEAD_FRAMES + PAPER_LEAVE_FRAMES) / FPS) * 1000;
const fromMs = 11113;
const toMs = 11514;
const spoken = toMs - fromMs + MIN_HOLD_MS;
const holdMs = Math.max(1900, spoken - WAIT_CLEAR_MS);
const paperEnd = fromMs + holdMs;
const headReturn = fromMs + spoken - (DROP_RETURN_LEAD_FRAMES / FPS) * 1000;
assert.ok(paperEnd <= headReturn, `paper ${paperEnd} must leave before head ${headReturn}`);

const DRAW_START_FRAMES = 8;
const DRAW_FRAMES = 26;
const holdFrames = Math.round((holdMs / 1000) * FPS);
assert.ok(DRAW_START_FRAMES + DRAW_FRAMES + PAPER_LEAVE_FRAMES < holdFrames, "draw must finish before the fold");
assert.ok(DRAW_START_FRAMES >= 6, "pencil starts after the paper has begun to open");
console.log("draw and wait clearance ok", {holdMs, paperEnd, headReturn, holdFrames});
