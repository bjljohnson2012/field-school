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
  "/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5";
const STILLS = "/opt/cursor/artifacts/remotion-progress-rail/2026-09-20";
const SLATE =
  "/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4";
const SLATE_SHA = "d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5";
const AUDIOBED =
  "/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4";
const AUDIOBED_SHA = "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f";

const PRIORS = {
  [SLATE]: SLATE_SHA,
  [AUDIOBED]: AUDIOBED_SHA,
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

test("ProgressRail is a five-tick lesson position signal after letterbox", () => {
  const layers = src("src", "layers.tsx");
  const demo = src("src", "ProgressRailDemo.tsx");
  assert.match(layers, /export function ProgressRail/);
  assert.match(layers, /export const PROGRESS_RAIL_BEATS = \["sting", "slate", "objective", "recap", "next-up"\]/);
  assert.match(layers, /export const PROGRESS_RAIL_H = 4/);
  assert.match(layers, /bottom: LETTERBOX_H \+ 12/);
  assert.match(layers, /Lesson position signal/);
  assert.match(layers, /After letterbox, before audio/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
  assert.match(demo, /id="ProgressRailDemo"|ProgressRailDemo/);
  assert.match(demo, /name="progress"/);
  assert.match(demo, /<ProgressRail beat=\{beat\} \/>/);
  assert.match(demo, /Math\.floor\(frame \/ 48\)/);
  assert.doesNotMatch(demo, /a_roll\.mp4|27pn9xs0zk8a73g/);
});

test("ProgressRailDemo registers; five spine plates carry progress between letterbox and audio", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  assert.match(rootTsx, /id="ProgressRailDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  const plates = {
    "Opener.tsx": "sting",
    "TalkingHeadCard.tsx": "slate",
    "DefinitionBoard.tsx": "objective",
    "RecapCard.tsx": "recap",
    "QuizBumper.tsx": "next-up",
  };
  for (const [file, beat] of Object.entries(plates)) {
    const blob = src("src", file);
    const letterbox = blob.indexOf('name="letterbox"');
    const progress = blob.indexOf('name="progress"');
    const audio = blob.indexOf('name="audio"');
    assert.ok(letterbox >= 0 && progress > letterbox && audio > progress, file);
    assert.match(blob, new RegExp(`<ProgressRail beat="${beat}" />`));
    assert.match(blob, /<AudioBed \/>/);
    assert.doesNotMatch(blob, /zIndex|z-index/);
  }
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
});

test("ORDER LOCK intact; docs seal ProgressRail PASS with hold_cleaning", () => {
  const note = src("antagonist-progress-rail.md");
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(note, /EDU-S03: SOFT/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(note, /3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5/);
  assert.match(note, /PR 102 merge `684a98a2dd595591bf775f1cccb04ba3de20f82d`/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.match(full, /## ProgressRail 2026-09-20/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(wave5, /## ProgressRail \(PASS\)/);
  assert.match(wave5, /PR 102 merge `684a98a`/);
  assert.match(wave5, /3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 102 merge `684a98a`/);
  assert.match(campus, /ProgressRail \*\*PASS\*\*/);
  assert.match(campus, /3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-progress-rail\.md/);
  assert.match(src("AGENTS.md"), /ProgressRailDemo/);
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
  for (const name of ["ProgressRailDemo-f0.png", "ProgressRailDemo-f60.png", "LessonSpine-slate-f330.png"]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on typecard-objectiveslate master holds; --flip refused", () => {
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
