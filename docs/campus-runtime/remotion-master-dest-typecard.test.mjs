import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const wave5 = readFileSync(join(here, "WAVE5.md"), "utf8");
const campus = readFileSync(join(here, "STATUS.md"), "utf8");
const note = readFileSync(
  join(here, "..", "..", "plates", "antagonist-lesson-spine-typecard-encode.md"),
  "utf8",
);

const MASTER =
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0";
const AUDIOBED =
  "/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4";
const KARAOKE = "/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4";
const ARCHIVED = "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("WAVE5 and STATUS lock TypeCard encode as archived prior dest", () => {
  assert.match(wave5, /lesson-spine-typecard-encode\/2026-09-20/);
  assert.match(wave5, /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(wave5, /Archived prior typecard-encode/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /Archived prior audiobed-encode/);
  assert.match(wave5, /lesson-spine-audiobed-encode\/2026-09-20/);
  assert.match(wave5, /9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f/);
  assert.match(campus, /Archived prior typecard-encode/);
  assert.match(campus, /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(campus, /Archived prior audiobed-encode/);
  assert.match(campus, /9f89f9a9…/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(note, /## Master dest 2026-09-20/);
  assert.match(note, /current LessonSpine master/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
});

test("master dest exists; audiobed and karaoke priors stay on disk", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  assert.equal(existsSync(AUDIOBED), true);
  assert.equal(existsSync(KARAOKE), true);
  assert.equal(sha256(AUDIOBED), ARCHIVED);
  assert.equal(sha256(KARAOKE), ARCHIVED);
  assert.notEqual(MASTER, AUDIOBED);
  assert.notEqual(MASTER, KARAOKE);
});

test("checklist on TypeCard master holds; --flip refused", () => {
  const checklist = join(here, "..", "..", "plates", "scripts", "cleaning-checklist-lesson-spine.mjs");
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
