import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");
const MASTER =
  "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
const MASTER_SHA = "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
const STILLS = "/opt/cursor/artifacts/remotion-antagonist-counterexample-encode-master/2026-09-21";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-analogy-encode/2026-09-21/LessonSpine.mp4";
const PRIOR_SHA = "a556a0b5a2beaec4b0cc44eadcbf6c092cd152a568282ce3eee06564be01af37";
const EVIDENCE =
  "/opt/cursor/artifacts/lesson-spine-evidence-encode/2026-09-21/LessonSpine.mp4";
const EVIDENCE_SHA = "5d0499f6cbff19149ce0b5da3c615a1ca0ab26fbbece2d9e26da0e78dd367c4b";
const RUBRIC =
  "/opt/cursor/artifacts/lesson-spine-rubric-encode/2026-09-21/LessonSpine.mp4";
const RUBRIC_SHA = "4aef4c713218247ebb4cad42b637f4b1331a02d6db4fcc13ac13e2bde156a337";
const THRESHOLD =
  "/opt/cursor/artifacts/lesson-spine-threshold-encode/2026-09-21/LessonSpine.mp4";
const THRESHOLD_SHA = "955f0256424fdc4ddb5ae5506a04a9ea877cb6a79ccb126ba1bb4884b9943a6f";
const SPECTRUM =
  "/opt/cursor/artifacts/lesson-spine-spectrum-encode/2026-09-21/LessonSpine.mp4";
const SPECTRUM_SHA = "496f506babd11a6e5247e87c3bbf926117b0de31feae5b6573fa891bdf6c68d0";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("full-set counterexample encode master reaudit is dated PASS with hold_cleaning", () => {
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(full, /## LessonSpine counterexample encode master dest reaudit 2026-09-21/);
  assert.match(full, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(full, /EDU-S01: PASS/);
  assert.match(full, /EDU-S02: PASS/);
  assert.match(full, /hold_cleaning: true/);
  assert.match(full, /Dated \*\*2026-09-21\*\* reaudit/);
  assert.match(full, /verdict: PASS/);
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.match(src("antagonist-counterexample-encode-master.md"), /EDU-S01: PASS/);
  assert.match(src("antagonist-counterexample-encode-master.md"), /EDU-S02: PASS/);
  assert.match(
    src("antagonist-counterexample-encode-master.md"),
    /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/,
  );
  assert.match(
    src("antagonist-counterexample-encode-master.md"),
    /PR 184 merge `7a8f010bd5e65948b55d3067a8262d1652e4975b`/,
  );
  assert.match(wave5, /## LessonSpine counterexample encode master dest reaudit \(PASS\)/);
  assert.match(wave5, /PR 184 merge `7a8f010`/);
  assert.match(wave5, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 184 merge `7a8f010`/);
  assert.match(campus, /LessonSpine counterexample encode master dest reaudit \*\*PASS\*\*/);
  assert.match(campus, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-counterexample-encode-master\.md/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
});

test("locked counterexample encode master dest and audit stills exist; priors untouched", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  assert.equal(existsSync(PRIOR), true);
  assert.equal(sha256(PRIOR), PRIOR_SHA);
  assert.equal(existsSync(EVIDENCE), true);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(existsSync(RUBRIC), true);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(existsSync(THRESHOLD), true);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(existsSync(SPECTRUM), true);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
  for (const name of [
    "LessonSpine-sting-f42.png",
    "LessonSpine-slate-f345.png",
    "LessonSpine-objective-f570.png",
    "LessonSpine-recap-f864.png",
    "LessonSpine-nextup-f1050.png",
    "CounterexampleCardDemo-f0.png",
    "CounterexampleCardDemo-f60.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on counterexample encode master holds; --flip refused", () => {
  const checklist = join(here, "cleaning-checklist-lesson-spine.mjs");
  const flip = spawnSync(process.execPath, [checklist, "--dest", MASTER, "--flip", "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(flip.status, 2);
  assert.match(flip.stdout, /flip_refused/);
  const pass = spawnSync(process.execPath, [checklist, "--dest", MASTER, "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(pass.status, 0, pass.stderr);
  const body = JSON.parse(pass.stdout);
  assert.equal(body.verdict, "PASS");
  assert.equal(body.hold_cleaning, true);
  assert.equal(body.auto_flip, false);
  assert.equal(body.sha256, MASTER_SHA);
});
