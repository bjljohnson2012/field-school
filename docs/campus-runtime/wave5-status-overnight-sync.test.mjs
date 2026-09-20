import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const wave5 = readFileSync(join(here, "WAVE5.md"), "utf8");
const campus = readFileSync(join(here, "STATUS.md"), "utf8");
const stub = readFileSync(join(here, "..", "prelaunch", "STATUS.md"), "utf8");

test("WAVE5 overnight sync matches main tip; launch stays CLOSED 0/8", () => {
  assert.match(wave5, /VOX-S05 OverlayLock polish/);
  assert.match(wave5, /antagonist-soft-polish-vox-s05\.md` \*\*PASS\*\*/);
  assert.match(wave5, /## Letterbox stack \(complete\)/);
  assert.match(wave5, /bed → screen → talking-head card → lower third → captions → letterbox → audio/);
  assert.match(wave5, /prelaunch\/LAUNCH_GATE\.md/);
  assert.match(wave5, /staff\/GRAPH\.md/);
  assert.match(wave5, /staff\/ROUTINES\.md/);
  assert.match(wave5, /PR 68 `50f0ea9`/);
  assert.match(wave5, /PR 65 closed SUPERSEDED, unmerged/);
  assert.match(wave5, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN|launch is open/i);
});

test("campus STATUS and prelaunch stub point at Plan SoT + hub", () => {
  assert.match(campus, /prelaunch\/LAUNCH_GATE\.md/);
  assert.match(campus, /prelaunch\/STATUS\.md/);
  assert.match(campus, /staff\/GRAPH\.md/);
  assert.match(campus, /staff\/ROUTINES\.md/);
  assert.match(campus, /VOX-S05 OverlayLock polish \*\*PASS\*\*/);
  assert.match(campus, /Letterbox stack complete/);
  assert.match(campus, /PR 65 closed SUPERSEDED, unmerged/);
  assert.match(stub, /campus-runtime\/WAVE5\.md/);
  assert.match(stub, /CLOSED/);
});
