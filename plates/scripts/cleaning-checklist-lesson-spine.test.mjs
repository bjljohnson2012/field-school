import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {
  DEFAULT_DEST,
  EXPECTED_SHA256,
  ORDER_LOCK,
  runChecklist,
} from "./cleaning-checklist-lesson-spine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const script = join(here, "cleaning-checklist-lesson-spine.mjs");

test("PASS against dated LessonSpine encode; never auto-flips", () => {
  assert.equal(existsSync(DEFAULT_DEST), true, "fixture encode missing");
  const result = runChecklist({dest: DEFAULT_DEST, platesRoot: root});
  assert.equal(result.verdict, "PASS", JSON.stringify(result.hardFail));
  assert.equal(result.exitCode, 0);
  assert.equal(result.auto_flip, false);
  assert.equal(result.hold_cleaning, true);
  assert.equal(result.shipGreen, false);
  assert.equal(result.ship[1].status, "HOLD");
  assert.equal(result.ship[6].status, "HOLD");
  assert.equal(result.sha256, EXPECTED_SHA256);
  assert.equal(result.order, ORDER_LOCK);
});

test("FAIL path: missing dest is HARD_FAIL exit 1", () => {
  const ran = spawnSync(process.execPath, [script, "--dest", "/tmp/no-such-LessonSpine.mp4", "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(ran.status, 1, ran.stdout);
  const body = JSON.parse(ran.stdout);
  assert.equal(body.verdict, "HARD_FAIL");
  assert.equal(body.auto_flip, false);
  assert.ok(body.hardFail.includes("VOX-H01") || body.hardFail.includes("RM-H09"));
});

test("refuses --flip", () => {
  const ran = spawnSync(process.execPath, [script, "--flip"], {encoding: "utf8"});
  assert.equal(ran.status, 2);
  assert.equal(JSON.parse(ran.stdout).error, "flip_refused");
});

test("README hooks future auto-flip and order lock", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.match(readme, /cleaning-checklist-lesson-spine/);
  assert.match(readme, /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/);
  assert.match(readme, /never flips/);
});
