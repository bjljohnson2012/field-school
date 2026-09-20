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
  "/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8";
const STILLS = "/opt/cursor/artifacts/remotion-antagonist-edu-s02-master/2026-09-20";
const EDU_S01 =
  "/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4";
const EDU_S01_SHA = "cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf";
const TYPECARD =
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4";
const TYPECARD_SHA = "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("full-set EDU-S02 master reaudit is dated PASS with hold_cleaning", () => {
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(full, /## EDU-S02 master dest reaudit 2026-09-20/);
  assert.match(full, /eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8/);
  assert.match(full, /EDU-S01: PASS/);
  assert.match(full, /EDU-S02: PASS/);
  assert.match(full, /hold_cleaning: true/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(full, /verdict: PASS/);
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.match(src("antagonist-edu-s02-master.md"), /EDU-S01: PASS/);
  assert.match(src("antagonist-edu-s02-master.md"), /EDU-S02: PASS/);
  assert.match(src("antagonist-edu-s02-master.md"), /eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8/);
  assert.match(src("antagonist-edu-s02-master.md"), /PR 90 merge `b4aeb1e102143863b3390de4b60ed64a81080b62`/);
  assert.match(wave5, /## EDU-S02 master dest reaudit \(PASS\)/);
  assert.match(wave5, /PR 90 merge `b4aeb1e`/);
  assert.match(wave5, /eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8/);
  assert.match(wave5, /\*\*Current master dest\*\./);
  assert.match(campus, /PR 90 merge `b4aeb1e`/);
  assert.match(campus, /EDU-S02 master dest reaudit \*\*PASS\*\*/);
  assert.match(campus, /eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-edu-s02-master\.md/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
});

test("locked EDU-S02 master dest and audit stills exist; priors untouched", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  assert.equal(existsSync(EDU_S01), true);
  assert.equal(sha256(EDU_S01), EDU_S01_SHA);
  assert.equal(existsSync(TYPECARD), true);
  assert.equal(sha256(TYPECARD), TYPECARD_SHA);
  for (const name of [
    "LessonSpine-sting-f30.png",
    "LessonSpine-slate-f330.png",
    "LessonSpine-objective-f570.png",
    "LessonSpine-recap-f864.png",
    "LessonSpine-nextup-f1050.png",
    "Opener-f30.png",
    "RecapCard-f144.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on EDU-S02 master holds; --flip refused", () => {
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
