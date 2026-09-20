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

test("WAVE5 notes karaoke gold dest and VOX-S01; launch stays CLOSED 0/8", () => {
  assert.match(wave5, /## Karaoke gold \(VOX-S01 PASS\)/);
  assert.match(wave5, /9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f/);
  assert.match(wave5, /028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98/);
  assert.match(wave5, /lesson-spine-karaoke-gold\/2026-09-20/);
  assert.match(wave5, /antagonist-captions-karaoke-gold\.md/);
  assert.match(wave5, /cleaning-checklist-lesson-spine-karaoke-gold\.md/);
  assert.match(wave5, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN|launch is open/i);
});

test("campus STATUS notes karaoke gold without inventing 8/8", () => {
  assert.match(campus, /9f89f9a9…/);
  assert.match(campus, /VOX-S01` PASS fixture/);
  assert.match(campus, /028d16e4…/);
  assert.match(stub, /karaoke gold `9f89f9a9…`/);
  assert.match(gate, /\*\*Launch is CLOSED\.\*\*/);
  assert.match(gate, /\*\*0\/8\*\*/);
  assert.doesNotMatch(gate, /8\/8 PASS|launch OPEN|launch is open/i);
});
