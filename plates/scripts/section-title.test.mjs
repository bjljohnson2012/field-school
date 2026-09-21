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
  "/opt/cursor/artifacts/lesson-spine-compare-encode/2026-09-21/LessonSpine.mp4";
const MASTER_SHA = "917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d";
const STILLS = "/opt/cursor/artifacts/remotion-section-title/2026-09-21";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-scripture-encode/2026-09-21/LessonSpine.mp4";
const PRIOR_SHA = "cb3a672da3871428548f2e6ec69da03b9c1d2e425058a1b4b856d928a6e43a79";

const PRIORS = {
  [PRIOR]: PRIOR_SHA,
  "/opt/cursor/artifacts/lesson-spine-key-claim-encode/2026-09-21/LessonSpine.mp4":
    "16f516640c5cac4609862ae2436eb37dd118e56bc6633e3dd10d76290a588606",
  "/opt/cursor/artifacts/lesson-spine-practice-encode/2026-09-21/LessonSpine.mp4":
    "8c953707401f835551ceec5d96c090b133cd619b41c4b7ff543b1637edc44dbf",
  "/opt/cursor/artifacts/lesson-spine-end-card-encode/2026-09-20/LessonSpine.mp4":
    "073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693",
  "/opt/cursor/artifacts/lesson-spine-transition-luma-encode/2026-09-20/LessonSpine.mp4":
    "f631402a6dfbb2ca2218ea9617c7b2af527eb7e88f8df5547dc6584c9ef5a96e",
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

test("SectionTitle is a section break / chapter title lock after sting/objective path", () => {
  const layers = src("src", "layers.tsx");
  const demo = src("src", "SectionTitleDemo.tsx");
  assert.match(layers, /export function SectionTitle/);
  assert.match(layers, /export const SECTION_TITLE_KICKER/);
  assert.match(layers, /export const SECTION_TITLE_LINE/);
  assert.match(layers, /SECTION_TITLE_KICKER = "Section"/);
  assert.match(layers, /SECTION_TITLE_LINE = "Name the section\."/);
  assert.match(layers, /Section break \/ chapter title/);
  assert.match(layers, /After sting\/objective path, after compare, before practice/);
  assert.match(layers, /borderLeft: `6px solid \$\{gold\}`/);
  assert.match(layers, /<Keyword>\{keyword\}<\/Keyword>/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
  assert.match(demo, /SectionTitleDemo/);
  assert.match(demo, /name="section"/);
  assert.match(demo, /<SectionTitle \/>/);
  assert.match(demo, /beat="objective"/);
  assert.doesNotMatch(demo, /a_roll\.mp4|27pn9xs0zk8a73g/);
});

test("SectionTitleDemo registers after CompareBoardDemo; Opener/Definition/Recap sequence section after compare", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const opener = src("src", "Opener.tsx");
  const board = src("src", "DefinitionBoard.tsx");
  const recap = src("src", "RecapCard.tsx");
  assert.match(rootTsx, /id="SectionTitleDemo"/);
  assert.match(rootTsx, /id="CompareBoardDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.ok(rootTsx.indexOf('id="CompareBoardDemo"') < rootTsx.indexOf('id="SectionTitleDemo"'));
  assert.ok(rootTsx.indexOf('id="SectionTitleDemo"') < rootTsx.indexOf('id="LessonSpine"'));
  const openerWipe = opener.indexOf('name="transition"');
  const openerCompare = opener.indexOf('name="compare"');
  const openerSection = opener.indexOf('name="section"');
  const openerAudio = opener.indexOf('name="audio"');
  assert.ok(
    openerWipe >= 0 &&
      openerCompare > openerWipe &&
      openerSection > openerCompare &&
      openerAudio > openerSection,
  );
  assert.match(opener, /<SectionTitle \/>/);
  const boardWipe = board.indexOf('name="transition"');
  const boardCompare = board.indexOf('name="compare"');
  const boardSection = board.indexOf('name="section"');
  const boardAudio = board.indexOf('name="audio"');
  assert.ok(
    boardWipe >= 0 &&
      boardCompare > boardWipe &&
      boardSection > boardCompare &&
      boardAudio > boardSection,
  );
  assert.match(board, /<SectionTitle \/>/);
  const recapWipe = recap.indexOf('name="transition"');
  const recapCompare = recap.indexOf('name="compare"');
  const recapSection = recap.indexOf('name="section"');
  const recapPractice = recap.indexOf('name="practice"');
  const recapAudio = recap.indexOf('name="audio"');
  assert.ok(
    recapWipe >= 0 &&
      recapCompare > recapWipe &&
      recapSection > recapCompare &&
      recapPractice > recapSection &&
      recapAudio > recapPractice,
  );
  assert.match(recap, /<SectionTitle \/>/);
  assert.match(recap, /<CompareBoard \/>/);
  assert.match(recap, /<PracticeCard \/>/);
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recapName = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recapName && recapName < next);
});

test("ORDER LOCK intact; docs seal SectionTitle PASS with hold_cleaning", () => {
  const note = src("antagonist-section-title.md");
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(note, /EDU-S03: SOFT/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(note, /917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d/);
  assert.match(note, /PR 132 merge `cd0d493b6efb764508442e200780ea47340e8198`/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up → EndCard/,
  );
  assert.match(full, /## SectionTitle 2026-09-21/);
  assert.match(full, /Dated \*\*2026-09-21\*\* reaudit/);
  assert.match(wave5, /## SectionTitle \(PASS\)/);
  assert.match(wave5, /PR 132 merge `cd0d493`/);
  assert.match(wave5, /917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 132 merge `cd0d493`/);
  assert.match(campus, /SectionTitle \*\*PASS\*\*/);
  assert.match(campus, /917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-section-title\.md/);
  assert.match(src("AGENTS.md"), /SectionTitleDemo/);
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
  for (const name of [
    "SectionTitleDemo-f0.png",
    "SectionTitleDemo-f60.png",
    "LessonSpine-objective-f570.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on compare-encode master holds; --flip refused", () => {
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
