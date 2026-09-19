import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const brief = JSON.parse(readFileSync(join(root, "briefs/ycjdt-pass2-remotion-scenes.json"), "utf8"));

assert.equal(brief.overlay.title, "You Can Just Do Things");
assert.equal(brief.overlay.x, 1576);
assert.equal(brief.overlay.y, 24);
assert.equal(brief.overlay.w, 80);
assert.equal(brief.overlay.h, 64);
assert.deepEqual(brief.transitions, [{type: "luma", duration: 0.5}]);
assert.equal(brief.audio.sfx, false);
assert.equal(brief.audio.music, false);
assert.equal(brief.engine, "remotion");
assert.equal(brief.fallback, "melt");
assert.equal(brief.just_locked, "27pn9xs0zk8a73g");
assert.equal(brief.remotion.scenes.length, 10);
assert.equal(brief.remotion.scenes[0].in, 0);
assert.equal(brief.remotion.scenes.at(-1).out, 651.878);
assert.equal(brief.proposed_chapters.at(-1).start, 595);

const motions = brief.remotion.scenes.map((s) => s.motion);
assert.ok(motions.includes("glide"), "pass-2 must wire glide");
assert.ok(motions.includes("takeover"), "pass-2 must wire takeover");
assert.equal(brief.remotion.scenes[0].motion, "takeover");
assert.equal(brief.remotion.scenes[1].motion, "glide");
assert.deepEqual(new Set(motions), new Set(["glide", "takeover"]));

for (let i = 1; i < brief.remotion.scenes.length; i += 1) {
  assert.equal(brief.remotion.scenes[i].in, brief.remotion.scenes[i - 1].out);
}
assert.equal(brief.do_not_overwrite.includes(brief.existing_pass2_master), true);

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

const mathSrc = readFileSync(join(root, "remotion/src/sceneMotionMath.ts"), "utf8");
assert.match(mathSrc, /export const GLIDE_FRAMES = 24/);
assert.match(mathSrc, /export const TAKEOVER_HOLD_FRAMES = 12/);
assert.match(mathSrc, /"glide"/);
assert.match(mathSrc, /"takeover"/);

const glide0 = glideCard(0);
assert.ok(glide0.x < -100);
assert.equal(glide0.opacity, 0);
const glideEnd = glideCard(24);
assert.ok(Math.abs(glideEnd.x) < 1e-9);
assert.equal(glideEnd.opacity, 1);

const take0 = takeoverHead(0);
assert.equal(take0.cardOwns, true);
assert.equal(take0.opacity, 0);
const takeDone = takeoverHead(30);
assert.equal(takeDone.opacity, 1);
assert.ok(Math.abs(takeDone.x) < 1e-9);

const types = readFileSync(join(root, "remotion/src/types.ts"), "utf8");
assert.match(types, /"spring" \| "interpolate" \| "glide" \| "takeover"/);
assert.match(types, /x: 1576/);
assert.match(types, /y: 24/);

const lesson = readFileSync(join(root, "remotion/src/FieldSchoolLesson.tsx"), "utf8");
assert.match(lesson, /GLIDE_FRAMES/);
assert.match(lesson, /TAKEOVER_HOLD_FRAMES/);
assert.match(lesson, /#EFE7D6/);
assert.doesNotMatch(lesson, /intro\.wav/);
assert.match(readFileSync(join(root, "remotion/src/Root.tsx"), "utf8"), /id="FieldSchoolLesson"/);

console.log("ycjdt-pass2-scenes.test.mjs PASS");
