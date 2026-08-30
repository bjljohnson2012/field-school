import assert from "node:assert/strict";

const CLIP_FRAMES = 1800;
const INTRO_FRAMES = 180;
const FPS = 30;
const SOURCE_START_MS = 2400;
const MIN_HOLD_MS = 3000;
const TYPE_MS = 1500;
const PLAYBOOK = /^playbook[,.]?$/i;

assert.equal((CLIP_FRAMES - INTRO_FRAMES) / FPS, 54);
assert.equal(SOURCE_START_MS + 54 * 1000, 56400);

const typedCount = (nowMs, fromMs, letters, typeMs = TYPE_MS) => {
  if (letters <= 0 || nowMs < fromMs) {
    return 0;
  }
  const t = (nowMs - fromMs) / typeMs;
  if (t >= 1) {
    return letters;
  }
  return Math.max(1, Math.min(letters, Math.ceil(t * letters)));
};

assert.equal(typedCount(14991, 14992, 9), 0);
assert.equal(typedCount(14992, 14992, 9), 1);
assert.equal(typedCount(14992 + TYPE_MS, 14992, 9), 9);
assert.equal(typedCount(14992 + TYPE_MS - 1, 14992, 9), 9);
assert.ok(PLAYBOOK.test("playbook,"));
assert.ok(PLAYBOOK.test("playbook."));
assert.equal(PLAYBOOK.test("waiting."), false);

const fromMs = 11089;
const toMs = 11570;
const dropMs = toMs - fromMs + MIN_HOLD_MS;
const brollEnd = fromMs + dropMs;
assert.ok(brollEnd > 14000, "waiting b-roll holds through the drop");
assert.ok(brollEnd < 14992, "head is back before playbook types");

const bedIntro = 0.52;
const bedUnder = 0.28;
assert.ok(bedIntro <= 0.55, "intro bed stays behind the lockup");
assert.ok(bedUnder >= 0.22, "speech bed does not cliff to silence");
assert.ok(bedUnder < bedIntro, "bed settles under the voice");

console.log("clip and typewriter clock ok", {dropMs, brollEnd});
