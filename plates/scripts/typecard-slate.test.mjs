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
  "/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5";
const STILLS = "/opt/cursor/artifacts/remotion-typecard-slate/2026-09-20";
const EDU_S02 =
  "/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4";
const EDU_S02_SHA = "eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8";
const EDU_S01 =
  "/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4";
const EDU_S01_SHA = "cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf";
const TYPECARD =
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4";
const TYPECARD_SHA = "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0";

const PRIORS = {
  [EDU_S02]: EDU_S02_SHA,
  [EDU_S01]: EDU_S01_SHA,
  [TYPECARD]: TYPECARD_SHA,
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

test("TypeCard claim copy keeps EDU-S02 Keyword gold tick", () => {
  const layers = src("src", "layers.tsx");
  const opener = src("src", "Opener.tsx");
  const recap = src("src", "RecapCard.tsx");
  const head = src("src", "TalkingHeadCard.tsx");
  const card = layers.slice(layers.indexOf("export function TypeCard"), layers.indexOf("export function HeadFixture"));
  const keyword = layers.slice(layers.indexOf("export function Keyword"));
  assert.match(card, /backgroundColor: cream/);
  assert.match(card, /borderLeft: `6px solid \$\{gold\}`/);
  assert.match(card, /padding: "24px 32px 28px"/);
  assert.match(card, /EDU-S02 last-word ticks live in children/);
  assert.match(keyword, /color: gold/);
  assert.match(keyword, /borderBottom: `3px solid \$\{gold\}`/);
  assert.match(opener, /<Keyword>\{claimKeyword\}<\/Keyword>/);
  assert.match(opener, /claimWords\.slice\(0, -1\)/);
  assert.match(head, /<Keyword>\{lineKeyword\}<\/Keyword>/);
  assert.match(head, /lineWords\.slice\(0, -1\)/);
  assert.match(recap, /<Keyword>\{pointKeyword\}<\/Keyword>/);
  assert.match(recap, /pointWords\.slice\(0, -1\)/);
  const title = layers.slice(layers.indexOf("export function Title"), layers.indexOf("export function Claim"));
  const claim = layers.slice(layers.indexOf("export function Claim"), layers.indexOf("export function ObjectiveSlate"));
  const lock = layers.slice(layers.indexOf("export function OverlayLock"), layers.indexOf("export function GoldRule"));
  assert.match(title, /fontSize: 56/);
  assert.match(title, /letterSpacing: "0.01em"/);
  assert.match(title, /wordSpacing: "0.16em"/);
  assert.match(claim, /wordSpacing: "0.14em"/);
  assert.match(lock, /fontSize: 30/);
  assert.match(lock, /letterSpacing: "0.02em"/);
  assert.match(lock, /wordSpacing: "0.2em"/);
  assert.match(lock, /whiteSpace: "nowrap"/);
  assert.doesNotMatch(layers, /cards\/ycjdt|ernest/i);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
});

test("ORDER LOCK intact; docs seal TypeCard slate PASS with hold_cleaning", () => {
  const spine = src("src", "LessonSpine.tsx");
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
  const note = src("antagonist-typecard-slate.md");
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(note, /EDU-S02: PASS/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(note, /d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5/);
  assert.match(note, /PR 97 merge `2581d9d1cdbcf0078d0013a34258daad90da2d42`/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.match(full, /## TypeCard slate 2026-09-20/);
  assert.match(full, /EDU-S02: PASS/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(src("antagonist-opener-recap.md"), /## TypeCard slate 2026-09-20/);
  assert.match(wave5, /## TypeCard slate \(PASS\)/);
  assert.match(wave5, /PR 97 merge `2581d9d`/);
  assert.match(wave5, /d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 97 merge `2581d9d`/);
  assert.match(campus, /TypeCard slate \*\*PASS\*\*/);
  assert.match(campus, /d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-typecard-slate\.md/);
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
    "Opener-f42.png",
    "RecapCard-f144.png",
    "TalkingHeadCard-f90.png",
    "LessonSpine-sting-f42.png",
    "LessonSpine-slate-f345.png",
    "LessonSpine-recap-f864.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on slate master holds; --flip refused", () => {
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
