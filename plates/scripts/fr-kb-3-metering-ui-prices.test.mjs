import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");
const MASTER =
  "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
const MASTER_SHA = "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
const ANALOGY =
  "/opt/cursor/artifacts/lesson-spine-analogy-encode/2026-09-21/LessonSpine.mp4";
const ANALOGY_SHA = "a556a0b5a2beaec4b0cc44eadcbf6c092cd152a568282ce3eee06564be01af37";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("WAVE5 STATUS cite FR-KB-3 metering UI after PR 189 merge; master dest untouched", () => {
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  const rail = src("..", "docs", "campus-runtime", "PLAYER_RAIL.md");
  assert.match(wave5, /## FR-KB-3 metering UI \(PASS\)/);
  assert.match(wave5, /PR 189 merge `90df7d4`/);
  assert.match(wave5, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /FR-KB-3 metering UI \*\*PASS\*\*/);
  assert.match(campus, /PR 189 merge `90df7d4`/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(rail, /\/metering/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  assert.equal(existsSync(ANALOGY), true);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
});
