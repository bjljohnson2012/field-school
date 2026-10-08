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

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("household product seal fills PR 196/197 wait-fill; dest untouched", () => {
  const campusTest = src("..", "app", "scripts", "household-product-seal.test.mjs");
  const pathTest = src("..", "app", "scripts", "parent-path-assembly-fr4.test.mjs");
  const portionTest = src("..", "app", "scripts", "parent-next-portion-fr5.test.mjs");
  const gate = src("..", "docs", "prelaunch", "LAUNCH_GATE.md");
  assert.match(campusTest, /wait-fill: path assembly and next portion run in one parent session/);
  assert.match(pathTest, /Path assembles under the selected Child from parent intent/);
  assert.match(portionTest, /Next slice under the selected Child from assembled path and parent intent/);
  assert.match(gate, /Product \| HELD/);
  assert.match(campusTest, /selectSupervisedPath/);
  assert.match(campusTest, /writeSupervisedPortion/);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
});
