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
  "/opt/cursor/artifacts/lesson-spine-caption-overlay-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c";
const STILLS = "/opt/cursor/artifacts/remotion-antagonist-caption-overlay-master/2026-09-20";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4";
const PRIOR_SHA = "68b8378a47d9eb57ed4b41f35bc2bf4ed6fd01a0694fca28c0a5ea90101fee92";
const PROGRESS =
  "/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4";
const PROGRESS_SHA = "a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7";
const TYPECARD_OBJ =
  "/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4";
const TYPECARD_OBJ_SHA = "3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5";
const SLATE =
  "/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4";
const SLATE_SHA = "d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5";
const EDU_S02 =
  "/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4";
const EDU_S02_SHA = "eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8";
const EDU_S01 =
  "/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4";
const EDU_S01_SHA = "cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf";
const TYPECARD =
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4";
const TYPECARD_SHA = "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("full-set caption-overlay master reaudit is dated PASS with hold_cleaning", () => {
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(full, /## LessonSpine caption-overlay master dest reaudit 2026-09-20/);
  assert.match(full, /5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c/);
  assert.match(full, /EDU-S01: PASS/);
  assert.match(full, /EDU-S02: PASS/);
  assert.match(full, /hold_cleaning: true/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(full, /verdict: PASS/);
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.match(src("antagonist-caption-overlay-master.md"), /EDU-S01: PASS/);
  assert.match(src("antagonist-caption-overlay-master.md"), /EDU-S02: PASS/);
  assert.match(src("antagonist-caption-overlay-master.md"), /5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c/);
  assert.match(src("antagonist-caption-overlay-master.md"), /PR 113 merge `61e6a76ca7219e2dae7479eb7722e49d2fe53f86`/);
  assert.match(wave5, /## LessonSpine caption-overlay master dest reaudit \(PASS\)/);
  assert.match(wave5, /PR 113 merge `61e6a76`/);
  assert.match(wave5, /5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 113 merge `61e6a76`/);
  assert.match(campus, /LessonSpine caption-overlay master dest reaudit \*\*PASS\*\*/);
  assert.match(campus, /5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-caption-overlay-master\.md/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
});

test("locked caption-overlay master dest and audit stills exist; priors untouched", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  assert.equal(existsSync(PRIOR), true);
  assert.equal(sha256(PRIOR), PRIOR_SHA);
  assert.equal(existsSync(PROGRESS), true);
  assert.equal(sha256(PROGRESS), PROGRESS_SHA);
  assert.equal(existsSync(TYPECARD_OBJ), true);
  assert.equal(sha256(TYPECARD_OBJ), TYPECARD_OBJ_SHA);
  assert.equal(existsSync(SLATE), true);
  assert.equal(sha256(SLATE), SLATE_SHA);
  assert.equal(existsSync(EDU_S02), true);
  assert.equal(sha256(EDU_S02), EDU_S02_SHA);
  assert.equal(existsSync(EDU_S01), true);
  assert.equal(sha256(EDU_S01), EDU_S01_SHA);
  assert.equal(existsSync(TYPECARD), true);
  assert.equal(sha256(TYPECARD), TYPECARD_SHA);
  for (const name of [
    "LessonSpine-sting-f42.png",
    "LessonSpine-slate-f345.png",
    "LessonSpine-objective-f570.png",
    "LessonSpine-recap-f864.png",
    "LessonSpine-nextup-f1050.png",
    "CaptionDensityDemo-f0.png",
    "CaptionDensityDemo-f60.png",
    "OverlayLockDemo-f0.png",
    "OverlayLockDemo-f60.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on caption-overlay master holds; --flip refused", () => {
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
