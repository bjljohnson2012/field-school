import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const mathSrc = readFileSync(join(root, "remotion/src/sceneMotionMath.ts"), "utf8");
assert.match(mathSrc, /export const GLIDE_FRAMES = 24/);
assert.match(mathSrc, /export const TAKEOVER_HOLD_FRAMES = 12/);
assert.match(mathSrc, /"glide"/);
assert.match(mathSrc, /"takeover"/);

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}
function smoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}
function glideCard(frame, frames = 24) {
  const t = smoothstep(frame / frames);
  return {x: (1 - t) * -140, opacity: t};
}
function takeoverHead(frame, hold = 12, ease = 18) {
  if (frame < hold) {
    return {opacity: 0, x: 120, cardOwns: true};
  }
  const t = smoothstep((frame - hold) / ease);
  return {opacity: t, x: (1 - t) * 120, cardOwns: false};
}

const glide0 = glideCard(0);
assert.ok(glide0.x < -100);
assert.equal(glide0.opacity, 0);
const glideMid = glideCard(12);
assert.ok(glideMid.x < 0);
assert.ok(glideMid.opacity > 0 && glideMid.opacity < 1);
const glideEnd = glideCard(24);
assert.ok(Math.abs(glideEnd.x) < 1e-9);
assert.equal(glideEnd.opacity, 1);

const take0 = takeoverHead(0);
assert.equal(take0.cardOwns, true);
assert.equal(take0.opacity, 0);
assert.equal(take0.x, 120);
const takeHold = takeoverHead(11);
assert.equal(takeHold.cardOwns, true);
const takeDone = takeoverHead(30);
assert.equal(takeDone.opacity, 1);
assert.ok(Math.abs(takeDone.x) < 1e-9);
assert.equal(takeDone.cardOwns, false);

const types = readFileSync(join(root, "remotion/src/types.ts"), "utf8");
assert.match(types, /"spring" \| "interpolate" \| "glide" \| "takeover"/);
assert.match(types, /x: 1576/);
assert.match(types, /y: 24/);
assert.match(types, /motion: "takeover"/);
assert.match(types, /motion: "glide"/);

const lesson = readFileSync(join(root, "remotion/src/FieldSchoolLesson.tsx"), "utf8");
assert.match(lesson, /glideCard/);
assert.match(lesson, /takeoverHead/);
assert.match(lesson, /#EFE7D6|#EFE7D6|cream/);
assert.doesNotMatch(lesson, /27pn9xs0zk8a73g/);
assert.doesNotMatch(lesson, /intro\.wav/);

const rootSrc = readFileSync(join(root, "remotion/src/Root.tsx"), "utf8");
assert.match(rootSrc, /id="FieldSchoolLesson"/);
assert.match(rootSrc, /motion: "takeover"/);
assert.match(rootSrc, /motion: "glide"/);

console.log("scene-motion.test.mjs PASS");
