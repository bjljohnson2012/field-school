import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");
const NEW_DEST =
  "/opt/cursor/artifacts/lesson-spine-glossary-encode/2026-09-21/LessonSpine.mp4";
const NEW_SHA = "247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c";
const STILLS = "/opt/cursor/artifacts/remotion-lesson-spine-glossary-encode/2026-09-21";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-section-encode/2026-09-21/LessonSpine.mp4";
const PRIOR_SHA = "f4bf345d6c0ec8c51941b3bb2d08c71589bc822632d935dc26b6d18c07a631e7";
const COMPARE =
  "/opt/cursor/artifacts/lesson-spine-compare-encode/2026-09-21/LessonSpine.mp4";
const COMPARE_SHA = "917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d";
const SCRIPTURE =
  "/opt/cursor/artifacts/lesson-spine-scripture-encode/2026-09-21/LessonSpine.mp4";
const SCRIPTURE_SHA = "cb3a672da3871428548f2e6ec69da03b9c1d2e425058a1b4b856d928a6e43a79";
const KEYCLAIM =
  "/opt/cursor/artifacts/lesson-spine-key-claim-encode/2026-09-21/LessonSpine.mp4";
const KEYCLAIM_SHA = "16f516640c5cac4609862ae2436eb37dd118e56bc6633e3dd10d76290a588606";
const PRACTICE =
  "/opt/cursor/artifacts/lesson-spine-practice-encode/2026-09-21/LessonSpine.mp4";
const PRACTICE_SHA = "8c953707401f835551ceec5d96c090b133cd619b41c4b7ff543b1637edc44dbf";
const ENDCARD =
  "/opt/cursor/artifacts/lesson-spine-end-card-encode/2026-09-20/LessonSpine.mp4";
const ENDCARD_SHA = "073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693";
const TRANSITION =
  "/opt/cursor/artifacts/lesson-spine-transition-luma-encode/2026-09-20/LessonSpine.mp4";
const TRANSITION_SHA = "f631402a6dfbb2ca2218ea9617c7b2af527eb7e88f8df5547dc6584c9ef5a96e";
const CAPTION =
  "/opt/cursor/artifacts/lesson-spine-caption-overlay-encode/2026-09-20/LessonSpine.mp4";
const CAPTION_SHA = "5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c";

const PRIORS = {
  [PRIOR]: PRIOR_SHA,
  [COMPARE]: COMPARE_SHA,
  [SCRIPTURE]: SCRIPTURE_SHA,
  [KEYCLAIM]: KEYCLAIM_SHA,
  [PRACTICE]: PRACTICE_SHA,
  [ENDCARD]: ENDCARD_SHA,
  [TRANSITION]: TRANSITION_SHA,
  [CAPTION]: CAPTION_SHA,
  "/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4":
    "68b8378a47d9eb57ed4b41f35bc2bf4ed6fd01a0694fca28c0a5ea90101fee92",
  "/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4":
    "a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7",
  "/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4":
    "3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5",
  "/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4":
    "d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5",
  "/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4":
    "eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8",
  "/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4":
    "cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf",
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4":
    "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0",
  "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4":
    "a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a",
  "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4":
    "ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211",
  "/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4":
    "028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98",
  "/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4":
    "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f",
  "/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4":
    "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f",
};

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("WAVE5 and STATUS promote glossary encode as current master dest", () => {
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  const note = src("antagonist-lesson-spine-glossary-encode.md");
  assert.match(
    wave5,
    /Current master LessonSpine dest: `\/opt\/cursor\/artifacts\/lesson-spine-glossary-encode\/2026-09-21\/LessonSpine\.mp4`/,
  );
  assert.match(wave5, /247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c/);
  assert.match(wave5, /## LessonSpine glossary encode \(PASS\)/);
  assert.match(wave5, /PRs 85–136/);
  assert.match(wave5, /PR 136 merge `71fb9fd`/);
  assert.match(wave5, /f4bf345d6c0ec8c51941b3bb2d08c71589bc822632d935dc26b6d18c07a631e7/);
  assert.match(wave5, /Archived prior section-encode/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /Current master LessonSpine dest is glossary-encode/);
  assert.match(campus, /247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c/);
  assert.match(campus, /PR 136 merge `71fb9fd`/);
  assert.match(campus, /Archived prior section-encode/);
  assert.match(campus, /f4bf345d6c0ec8c51941b3bb2d08c71589bc822632d935dc26b6d18c07a631e7/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(note, /EDU-S01: PASS/);
  assert.match(note, /EDU-S02: PASS/);
  assert.match(note, /247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c/);
  assert.match(note, /PR 136 merge `71fb9fd3aa6b4709cee42b1515e06826cd435963`/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.match(src("README.md"), /antagonist-lesson-spine-glossary-encode\.md/);
  assert.doesNotMatch(note, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(src("antagonist-full-set.md"), /8\/8 PASS|launch OPEN|HARD_FAIL/);
});

test("new dest exists; section-encode and other priors untouched", () => {
  assert.equal(existsSync(NEW_DEST), true);
  assert.equal(sha256(NEW_DEST), NEW_SHA);
  assert.notEqual(NEW_DEST, PRIOR);
  assert.notEqual(NEW_SHA, PRIOR_SHA);
  for (const [dest, hash] of Object.entries(PRIORS)) {
    assert.equal(existsSync(dest), true, dest);
    assert.equal(sha256(dest), hash, dest);
  }
  for (const name of [
    "LessonSpine-sting-f42.png",
    "LessonSpine-slate-f345.png",
    "LessonSpine-objective-f570.png",
    "LessonSpine-recap-f864.png",
    "LessonSpine-nextup-f1050.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("render-lock dry-run forwards the new dest and refuses Just", () => {
  const dir = mkdtempSync(join(tmpdir(), "glossary-encode-lock-"));
  const missingLock = join(dir, "absent.render.lock");
  const meminfo = join(dir, "meminfo");
  writeFileSync(meminfo, "MemAvailable: 8192000 kB\n");
  const ok = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--dest",
      NEW_DEST,
      "--lock",
      missingLock,
      "--meminfo",
      meminfo,
      "--dry-run",
    ],
    {encoding: "utf8"},
  );
  assert.equal(ok.status, 0, ok.stderr);
  const body = JSON.parse(ok.stdout);
  assert.equal(body.ok, true);
  assert.equal(body.dest, NEW_DEST);
  const just = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--cap-id",
      "27pn9xs0zk8a73g",
      "--dest",
      NEW_DEST,
      "--lock",
      missingLock,
      "--meminfo",
      meminfo,
      "--dry-run",
    ],
    {encoding: "utf8"},
  );
  assert.equal(just.status, 2);
  assert.equal(JSON.parse(just.stdout).error, "locked_dest");
});

test("checklist on new dest holds; --flip refused", () => {
  const checklist = join(here, "cleaning-checklist-lesson-spine.mjs");
  const flip = spawnSync(process.execPath, [checklist, "--dest", NEW_DEST, "--flip", "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(flip.status, 2);
  assert.match(flip.stdout, /flip_refused/);
  const pass = spawnSync(process.execPath, [checklist, "--dest", NEW_DEST, "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(pass.status, 0, pass.stderr);
  const body = JSON.parse(pass.stdout);
  assert.equal(body.verdict, "PASS");
  assert.equal(body.hold_cleaning, true);
  assert.equal(body.auto_flip, false);
  assert.equal(body.sha256, NEW_SHA);
});
