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
  "/opt/cursor/artifacts/lesson-spine-source-encode/2026-09-21/LessonSpine.mp4";
const MASTER_SHA = "833d39f430b657e09534b5ddd011e321ce2697f590738001c4c217af6aef1478";
const STILLS = "/opt/cursor/artifacts/remotion-antagonist-source-encode-master/2026-09-21";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-timeline-encode/2026-09-21/LessonSpine.mp4";
const PRIOR_SHA = "2b2dab3e239656e122d4dda3199e294ec836351a83120efaefe2aa54e4b8c068";
const REFLECTION =
  "/opt/cursor/artifacts/lesson-spine-reflection-encode/2026-09-21/LessonSpine.mp4";
const REFLECTION_SHA = "1e244f82eabceff7e3b16f39d41ff8d49e002aec188c694257f5da9bb4e77f17";
const CAVEAT =
  "/opt/cursor/artifacts/lesson-spine-caveat-encode/2026-09-21/LessonSpine.mp4";
const CAVEAT_SHA = "e23cadde85af2540d3c4f9c8a8434126655133b50c0cdc6c5783b16d9e446fd7";
const STEPS =
  "/opt/cursor/artifacts/lesson-spine-steps-encode/2026-09-21/LessonSpine.mp4";
const STEPS_SHA = "e0ead459d9505cd612403e8601ab1bfd9ef1acbfc3eba59d3640e19ce621935b";
const QUOTE =
  "/opt/cursor/artifacts/lesson-spine-quote-encode/2026-09-21/LessonSpine.mp4";
const QUOTE_SHA = "244c485bbfd83e2138c4e499fc07a00f566be3d1ede1c5a3f03dfd57b04feb2d";
const EXAMPLE =
  "/opt/cursor/artifacts/lesson-spine-example-encode/2026-09-21/LessonSpine.mp4";
const EXAMPLE_SHA = "f52ae59972fb4c0945febfa8b3166a217822548f8db6eff3468062fe07c0c33b";
const CHECKPOINT =
  "/opt/cursor/artifacts/lesson-spine-checkpoint-encode/2026-09-21/LessonSpine.mp4";
const CHECKPOINT_SHA = "19e5a19c47f72197bbf726707b839bdf287fd3f0111d105b2161fd694584246a";
const STING =
  "/opt/cursor/artifacts/lesson-spine-sting-encode/2026-09-21/LessonSpine.mp4";
const STING_SHA = "325a41e775821c8576e14038d2076ee639d48a0fc29b3f84b223f4af9390f204";
const OBJECTION =
  "/opt/cursor/artifacts/lesson-spine-objection-encode/2026-09-21/LessonSpine.mp4";
const OBJECTION_SHA = "4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee";
const GLOSSARY =
  "/opt/cursor/artifacts/lesson-spine-glossary-encode/2026-09-21/LessonSpine.mp4";
const GLOSSARY_SHA = "247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c";
const SECTION =
  "/opt/cursor/artifacts/lesson-spine-section-encode/2026-09-21/LessonSpine.mp4";
const SECTION_SHA = "f4bf345d6c0ec8c51941b3bb2d08c71589bc822632d935dc26b6d18c07a631e7";
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
const END_CARD =
  "/opt/cursor/artifacts/lesson-spine-end-card-encode/2026-09-20/LessonSpine.mp4";
const END_CARD_SHA = "073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693";
const TRANSITION =
  "/opt/cursor/artifacts/lesson-spine-transition-luma-encode/2026-09-20/LessonSpine.mp4";
const TRANSITION_SHA = "f631402a6dfbb2ca2218ea9617c7b2af527eb7e88f8df5547dc6584c9ef5a96e";
const CAPTION =
  "/opt/cursor/artifacts/lesson-spine-caption-overlay-encode/2026-09-20/LessonSpine.mp4";
const CAPTION_SHA = "5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c";
const LOWER =
  "/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4";
const LOWER_SHA = "68b8378a47d9eb57ed4b41f35bc2bf4ed6fd01a0694fca28c0a5ea90101fee92";
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

test("full-set source encode master reaudit is dated PASS with hold_cleaning", () => {
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(full, /## LessonSpine source encode master dest reaudit 2026-09-21/);
  assert.match(full, /833d39f430b657e09534b5ddd011e321ce2697f590738001c4c217af6aef1478/);
  assert.match(full, /EDU-S01: PASS/);
  assert.match(full, /EDU-S02: PASS/);
  assert.match(full, /hold_cleaning: true/);
  assert.match(full, /Dated \*\*2026-09-21\*\* reaudit/);
  assert.match(full, /verdict: PASS/);
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.match(src("antagonist-source-encode-master.md"), /EDU-S01: PASS/);
  assert.match(src("antagonist-source-encode-master.md"), /EDU-S02: PASS/);
  assert.match(
    src("antagonist-source-encode-master.md"),
    /833d39f430b657e09534b5ddd011e321ce2697f590738001c4c217af6aef1478/,
  );
  assert.match(
    src("antagonist-source-encode-master.md"),
    /PR 166 merge `9b7dc9f5ead981bdc6789184f6f51b1ea8f58845`/,
  );
  assert.match(wave5, /## LessonSpine source encode master dest reaudit \(PASS\)/);
  assert.match(wave5, /PR 166 merge `9b7dc9f`/);
  assert.match(wave5, /833d39f430b657e09534b5ddd011e321ce2697f590738001c4c217af6aef1478/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 166 merge `9b7dc9f`/);
  assert.match(campus, /LessonSpine source encode master dest reaudit \*\*PASS\*\*/);
  assert.match(campus, /833d39f430b657e09534b5ddd011e321ce2697f590738001c4c217af6aef1478/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-source-encode-master\.md/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
});

test("locked source encode master dest and audit stills exist; priors untouched", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  assert.equal(existsSync(PRIOR), true);
  assert.equal(sha256(PRIOR), PRIOR_SHA);
  assert.equal(existsSync(REFLECTION), true);
  assert.equal(sha256(REFLECTION), REFLECTION_SHA);
  assert.equal(existsSync(CAVEAT), true);
  assert.equal(sha256(CAVEAT), CAVEAT_SHA);
  assert.equal(existsSync(STEPS), true);
  assert.equal(sha256(STEPS), STEPS_SHA);
  assert.equal(existsSync(QUOTE), true);
  assert.equal(sha256(QUOTE), QUOTE_SHA);
  assert.equal(existsSync(EXAMPLE), true);
  assert.equal(sha256(EXAMPLE), EXAMPLE_SHA);
  assert.equal(existsSync(CHECKPOINT), true);
  assert.equal(sha256(CHECKPOINT), CHECKPOINT_SHA);
  assert.equal(existsSync(STING), true);
  assert.equal(sha256(STING), STING_SHA);
  assert.equal(existsSync(OBJECTION), true);
  assert.equal(sha256(OBJECTION), OBJECTION_SHA);
  assert.equal(existsSync(GLOSSARY), true);
  assert.equal(sha256(GLOSSARY), GLOSSARY_SHA);
  assert.equal(existsSync(SECTION), true);
  assert.equal(sha256(SECTION), SECTION_SHA);
  assert.equal(existsSync(COMPARE), true);
  assert.equal(sha256(COMPARE), COMPARE_SHA);
  assert.equal(existsSync(SCRIPTURE), true);
  assert.equal(sha256(SCRIPTURE), SCRIPTURE_SHA);
  assert.equal(existsSync(KEYCLAIM), true);
  assert.equal(sha256(KEYCLAIM), KEYCLAIM_SHA);
  assert.equal(existsSync(PRACTICE), true);
  assert.equal(sha256(PRACTICE), PRACTICE_SHA);
  assert.equal(existsSync(END_CARD), true);
  assert.equal(sha256(END_CARD), END_CARD_SHA);
  assert.equal(existsSync(TRANSITION), true);
  assert.equal(sha256(TRANSITION), TRANSITION_SHA);
  assert.equal(existsSync(CAPTION), true);
  assert.equal(sha256(CAPTION), CAPTION_SHA);
  assert.equal(existsSync(LOWER), true);
  assert.equal(sha256(LOWER), LOWER_SHA);
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
    "SourceChipDemo-f0.png",
    "SourceChipDemo-f60.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on source encode master holds; --flip refused", () => {
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
