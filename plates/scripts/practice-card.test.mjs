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
  "/opt/cursor/artifacts/lesson-spine-end-card-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693";
const STILLS = "/opt/cursor/artifacts/remotion-practice-card/2026-09-20";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-transition-luma-encode/2026-09-20/LessonSpine.mp4";
const PRIOR_SHA = "f631402a6dfbb2ca2218ea9617c7b2af527eb7e88f8df5547dc6584c9ef5a96e";

const PRIORS = {
  [PRIOR]: PRIOR_SHA,
  "/opt/cursor/artifacts/lesson-spine-caption-overlay-encode/2026-09-20/LessonSpine.mp4":
    "5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c",
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
};

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("PracticeCard is an application / try-this after Recap/Quiz path", () => {
  const layers = src("src", "layers.tsx");
  const demo = src("src", "PracticeCardDemo.tsx");
  assert.match(layers, /export function PracticeCard/);
  assert.match(layers, /export const PRACTICE_CARD_KICKER/);
  assert.match(layers, /export const PRACTICE_CARD_LINE/);
  assert.match(layers, /PRACTICE_CARD_KICKER = "Try this"/);
  assert.match(layers, /PRACTICE_CARD_LINE = "Apply one idea now\."/);
  assert.match(layers, /Application \/ try-this/);
  assert.match(layers, /After Recap\/Quiz path, before end/);
  assert.match(layers, /borderLeft: `6px solid \$\{gold\}`/);
  assert.match(layers, /<Keyword>\{keyword\}<\/Keyword>/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
  assert.match(demo, /PracticeCardDemo/);
  assert.match(demo, /name="practice"/);
  assert.match(demo, /<PracticeCard \/>/);
  assert.match(demo, /beat="recap"/);
  assert.doesNotMatch(demo, /a_roll\.mp4|27pn9xs0zk8a73g/);
});

test("PracticeCardDemo registers after EndCardDemo; Recap/Quiz sequence Practice after Recap/Quiz path", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const recap = src("src", "RecapCard.tsx");
  const quiz = src("src", "QuizBumper.tsx");
  assert.match(rootTsx, /id="PracticeCardDemo"/);
  assert.match(rootTsx, /id="EndCardDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.ok(rootTsx.indexOf('id="EndCardDemo"') < rootTsx.indexOf('id="PracticeCardDemo"'));
  assert.ok(rootTsx.indexOf('id="PracticeCardDemo"') < rootTsx.indexOf('id="LessonSpine"'));
  const recapWipe = recap.indexOf('name="transition"');
  const recapPractice = recap.indexOf('name="practice"');
  const recapAudio = recap.indexOf('name="audio"');
  assert.ok(recapWipe >= 0 && recapPractice > recapWipe && recapAudio > recapPractice);
  assert.match(recap, /<PracticeCard \/>/);
  const wipe = quiz.indexOf('name="transition"');
  const practice = quiz.indexOf('name="practice"');
  const end = quiz.indexOf('name="end"');
  const audio = quiz.indexOf('name="audio"');
  assert.ok(wipe >= 0 && practice > wipe && end > practice && audio > end);
  assert.match(quiz, /<PracticeCard \/>/);
  assert.match(quiz, /<EndCard \/>/);
  assert.doesNotMatch(quiz, /zIndex|z-index/);
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recapName = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recapName && recapName < next);
});

test("ORDER LOCK intact; docs seal PracticeCard PASS with hold_cleaning", () => {
  const note = src("antagonist-practice-card.md");
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(note, /EDU-S03: SOFT/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(note, /073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693/);
  assert.match(note, /PR 120 merge `e8e014bd79398968f85a7aaabcaf0099ff77f84f`/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up → EndCard/,
  );
  assert.match(full, /## PracticeCard 2026-09-20/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(wave5, /## PracticeCard \(PASS\)/);
  assert.match(wave5, /PR 120 merge `e8e014b`/);
  assert.match(wave5, /073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 120 merge `e8e014b`/);
  assert.match(campus, /PracticeCard \*\*PASS\*\*/);
  assert.match(campus, /073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-practice-card\.md/);
  assert.match(src("AGENTS.md"), /PracticeCardDemo/);
  assert.doesNotMatch(note, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
});

test("stills exist; locked master and priors untouched", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  for (const [dest, hash] of Object.entries(PRIORS)) {
    assert.equal(existsSync(dest), true, dest);
    assert.equal(sha256(dest), hash, dest);
  }
  for (const name of ["PracticeCardDemo-f0.png", "PracticeCardDemo-f60.png", "LessonSpine-recap-f864.png"]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on end-card master holds; --flip refused", () => {
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
