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
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0";
const STILLS = "/opt/cursor/artifacts/remotion-edu-s01-objective-slate/2026-09-20";

const PRIORS = {
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

test("Opener and RecapCard share EDU-S01 You will be able to slate", () => {
  const fixture = src("src", "objectiveSlate.ts");
  assert.match(fixture, /export const EDU_S01_PREFIX = "You will be able to"/);
  assert.match(fixture, /export const EDU_S01_OBJECTIVE = "draw one idea per beat"/);
  assert.match(src("src", "layers.tsx"), /export function ObjectiveSlate/);
  assert.match(src("src", "layers.tsx"), /You will be able to/);
  assert.match(src("src", "Opener.tsx"), /<ObjectiveSlate objective=\{objective\}/);
  assert.match(src("src", "RecapCard.tsx"), /<ObjectiveSlate objective=\{objective\}/);
  assert.match(src("src", "RecapCard.tsx"), /points\.slice\(0, 3\)/);
  assert.doesNotMatch(src("src", "RecapCard.tsx"), /points\.slice\(0, 4\)/);
  assert.match(src("src", "Root.tsx"), /objective: EDU_S01_OBJECTIVE/);
  assert.match(src("src", "LessonSpine.tsx"), /name="sting"/);
  const spine = src("src", "LessonSpine.tsx");
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
});

test("docs seal EDU-S01 PASS with hold_cleaning; launch stays CLOSED 0/8", () => {
  const note = src("antagonist-edu-s01-objective-slate.md");
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(note, /EDU-S01: PASS/);
  assert.match(note, /You will be able to/);
  assert.match(note, /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(full, /## EDU-S01 objective slate 2026-09-20/);
  assert.match(full, /EDU-S01: PASS/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(wave5, /## EDU-S01 objective slate \(PASS\)/);
  assert.match(wave5, /PRs 79–84 harvested/);
  assert.match(wave5, /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(campus, /PRs 79–84 harvested/);
  assert.match(campus, /EDU-S01 objective slate \*\*PASS\*\*/);
  assert.match(campus, /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
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
    "Opener-f30.png",
    "Opener-f150.png",
    "RecapCard-f144.png",
    "LessonSpine-sting-f30.png",
    "LessonSpine-recap-f864.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on TypeCard master holds; --flip refused", () => {
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
