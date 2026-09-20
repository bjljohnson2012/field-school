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
const STILLS = "/opt/cursor/artifacts/remotion-antagonist-typecard-master/2026-09-20";

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

test("full-set TypeCard master reaudit is dated PASS with hold_cleaning", () => {
  const full = src("antagonist-full-set.md");
  assert.match(full, /## TypeCard master dest reaudit 2026-09-20/);
  assert.match(full, /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(full, /lesson-spine-typecard-encode\/2026-09-20/);
  assert.match(full, /VOX-S04: PASS/);
  assert.match(full, /hold_cleaning: true/);
  assert.match(full, /auto_flip: false/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(full, /verdict: PASS/);
  assert.match(full, /028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98/);
  assert.match(full, /a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a/);
  assert.match(full, /ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211/);
  assert.match(full, /9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f/);
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.match(src("antagonist-typecard-master.md"), /VOX-S04: PASS/);
  assert.match(src("antagonist-typecard-master.md"), /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(src("..", "docs", "campus-runtime", "WAVE5.md"), /## TypeCard master dest reaudit \(PASS\)/);
});

test("locked master dest and audit stills exist; priors untouched", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  for (const [dest, hash] of Object.entries(PRIORS)) {
    assert.equal(existsSync(dest), true, dest);
    assert.equal(sha256(dest), hash, dest);
  }
  for (const name of [
    "LessonSpine-sting-f30.png",
    "LessonSpine-slate-f330.png",
    "LessonSpine-objective-f570.png",
    "LessonSpine-recap-f864.png",
    "LessonSpine-nextup-f1050.png",
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
