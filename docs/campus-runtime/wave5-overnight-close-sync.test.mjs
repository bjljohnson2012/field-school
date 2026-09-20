import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const wave5 = readFileSync(join(here, "WAVE5.md"), "utf8");
const campus = readFileSync(join(here, "STATUS.md"), "utf8");
const stub = readFileSync(join(here, "..", "prelaunch", "STATUS.md"), "utf8");
const gate = readFileSync(join(here, "..", "prelaunch", "LAUNCH_GATE.md"), "utf8");

test("WAVE5 close-of-night notes letterbox encode and antagonist reaudit; launch stays CLOSED 0/8", () => {
  assert.match(wave5, /2026-09-20 overnight close-sync/);
  assert.match(wave5, /LessonSpine letterbox encode \| PR 70 `4f66e6d`/);
  assert.match(wave5, /Antagonist full-set reaudit \| PR 71 `da967d2`/);
  assert.match(wave5, /028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98/);
  assert.match(wave5, /## Antagonist full-set reaudit \(PASS\)/);
  assert.match(wave5, /\*\*PASS\.\*\* SOFT notes only/);
  assert.match(wave5, /antagonist-full-set\.md/);
  assert.match(wave5, /cleaning-checklist-lesson-spine-letterbox-encode\.md/);
  assert.match(wave5, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(wave5, /PR 65 closed SUPERSEDED, unmerged/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN|launch is open/i);
});

test("campus STATUS and prelaunch stub note 028d16e4 encode + reaudit PASS SOFT; gate stays 0/8", () => {
  assert.match(campus, /028d16e4…/);
  assert.match(campus, /Antagonist full-set reaudit \*\*PASS\*\* \(SOFT only, PR 71\)/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(stub, /overnight close-sync/);
  assert.match(stub, /028d16e4…/);
  assert.match(stub, /antagonist full-set reaudit PASS \(SOFT only\)/);
  assert.match(stub, /CLOSED/);
  assert.match(gate, /\*\*Launch is CLOSED\.\*\*/);
  assert.match(gate, /\*\*0\/8\*\*/);
  assert.doesNotMatch(gate, /8\/8 PASS|launch OPEN|launch is open/i);
});
