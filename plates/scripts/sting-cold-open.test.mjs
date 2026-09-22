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
  "/opt/cursor/artifacts/lesson-spine-objection-encode/2026-09-21/LessonSpine.mp4";
const MASTER_SHA = "4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee";
const STILLS = "/opt/cursor/artifacts/remotion-sting-cold-open/2026-09-21";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-glossary-encode/2026-09-21/LessonSpine.mp4";
const PRIOR_SHA = "247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c";

const PRIORS = {
  [PRIOR]: PRIOR_SHA,
  "/opt/cursor/artifacts/lesson-spine-section-encode/2026-09-21/LessonSpine.mp4":
    "f4bf345d6c0ec8c51941b3bb2d08c71589bc822632d935dc26b6d18c07a631e7",
  "/opt/cursor/artifacts/lesson-spine-compare-encode/2026-09-21/LessonSpine.mp4":
    "917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d",
  "/opt/cursor/artifacts/lesson-spine-scripture-encode/2026-09-21/LessonSpine.mp4":
    "cb3a672da3871428548f2e6ec69da03b9c1d2e425058a1b4b856d928a6e43a79",
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

test("StingColdOpen is a cold open / hook on the ORDER LOCK first beat", () => {
  const layers = src("src", "layers.tsx");
  const demo = src("src", "StingColdOpenDemo.tsx");
  const opener = src("src", "Opener.tsx");
  assert.match(layers, /export function StingColdOpen/);
  assert.match(layers, /export const STING_COLD_OPEN_KICKER/);
  assert.match(layers, /export const STING_COLD_OPEN_LINE/);
  assert.match(layers, /STING_COLD_OPEN_KICKER = "Cold open"/);
  assert.match(layers, /STING_COLD_OPEN_LINE = "Start on the hook\."/);
  assert.match(layers, /Cold open \/ hook/);
  assert.match(layers, /ORDER LOCK first beat, sting only/);
  assert.match(layers, /borderLeft: `6px solid \$\{gold\}`/);
  assert.match(layers, /<Keyword>\{keyword\}<\/Keyword>/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
  assert.match(demo, /StingColdOpenDemo/);
  assert.match(demo, /name="cold-open"/);
  assert.match(demo, /<StingColdOpen \/>/);
  assert.match(demo, /beat="sting"/);
  assert.doesNotMatch(demo, /a_roll\.mp4|27pn9xs0zk8a73g/);
  assert.doesNotMatch(opener, /<StingColdOpen \/>/);
  assert.doesNotMatch(opener, /name="cold-open"/);
});

test("StingColdOpenDemo registers after ObjectionCardDemo; Opener sequences cold-open after objection; downstream plates unchanged", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const opener = src("src", "Opener.tsx");
  const board = src("src", "DefinitionBoard.tsx");
  const recap = src("src", "RecapCard.tsx");
  const head = src("src", "TalkingHeadCard.tsx");
  const quiz = src("src", "QuizBumper.tsx");
  assert.match(rootTsx, /id="StingColdOpenDemo"/);
  assert.match(rootTsx, /id="ObjectionCardDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.ok(rootTsx.indexOf('id="ObjectionCardDemo"') < rootTsx.indexOf('id="StingColdOpenDemo"'));
  assert.ok(rootTsx.indexOf('id="StingColdOpenDemo"') < rootTsx.indexOf('id="LessonSpine"'));
  const openerWipe = opener.indexOf('name="transition"');
  const openerAudio = opener.indexOf('name="audio"');
  assert.ok(openerWipe >= 0 && openerAudio > openerWipe);
  assert.doesNotMatch(opener, /<StingColdOpen \/>|name="cold-open"/);
  assert.doesNotMatch(board, /StingColdOpen|name="cold-open"/);
  assert.doesNotMatch(recap, /StingColdOpen|name="cold-open"/);
  assert.doesNotMatch(head, /StingColdOpen|name="cold-open"/);
  assert.doesNotMatch(quiz, /StingColdOpen|name="cold-open"/);
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recapName = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recapName && recapName < next);
});

test("ORDER LOCK intact; docs seal Sting cold open PASS with hold_cleaning", () => {
  const note = src("antagonist-sting-cold-open.md");
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(note, /EDU-S03: SOFT/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(note, /4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee/);
  assert.match(note, /PR 140 merge `357ea04125a9dc15df606d041280f0afbc2d4a85`/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up → EndCard/,
  );
  assert.match(full, /## Sting cold open 2026-09-21/);
  assert.match(full, /Dated \*\*2026-09-21\*\* reaudit/);
  assert.match(wave5, /## Sting cold open \(PASS\)/);
  assert.match(wave5, /PR 140 merge `357ea04`/);
  assert.match(wave5, /4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 140 merge `357ea04`/);
  assert.match(campus, /Sting cold open \*\*PASS\*\*/);
  assert.match(campus, /4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-sting-cold-open\.md/);
  assert.match(src("AGENTS.md"), /StingColdOpenDemo/);
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
    "StingColdOpenDemo-f0.png",
    "StingColdOpenDemo-f60.png",
    "LessonSpine-sting-f42.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on objection-encode master holds; --flip refused", () => {
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
