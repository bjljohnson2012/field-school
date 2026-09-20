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
  "/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4";
const NEW_SHA = "cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf";
const STILLS = "/opt/cursor/artifacts/remotion-edu-s01-spine-encode/2026-09-20";
const TYPECARD =
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4";
const TYPECARD_SHA = "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0";

const PRIORS = {
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

test("WAVE5 and STATUS promote EDU-S01 encode as current master dest", () => {
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  const note = src("antagonist-lesson-spine-edu-s01-encode.md");
  assert.match(
    wave5,
    /Current master LessonSpine dest: `\/opt\/cursor\/artifacts\/lesson-spine-edu-s01-encode\/2026-09-20\/LessonSpine\.mp4`/,
  );
  assert.match(wave5, /cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf/);
  assert.match(wave5, /## EDU-S01 LessonSpine encode \(PASS\)/);
  assert.match(wave5, /PR 85 `a97167a`/);
  assert.match(wave5, /PRs 79–84 harvested/);
  assert.match(wave5, /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(campus, /Current master LessonSpine dest is edu-s01-encode/);
  assert.match(campus, /cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf/);
  assert.match(campus, /PR 85 merged tip `a97167a`/);
  assert.match(campus, /PRs 79–84 harvested/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(note, /EDU-S01: PASS/);
  assert.match(note, /cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.doesNotMatch(note, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(src("antagonist-full-set.md"), /8\/8 PASS|launch OPEN|HARD_FAIL/);
});

test("new dest exists; typecard and other priors untouched", () => {
  assert.equal(existsSync(NEW_DEST), true);
  assert.equal(sha256(NEW_DEST), NEW_SHA);
  assert.notEqual(NEW_DEST, TYPECARD);
  assert.notEqual(NEW_SHA, TYPECARD_SHA);
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

test("render-lock dry-run forwards the EDU-S01 dest and refuses Just", () => {
  const dir = mkdtempSync(join(tmpdir(), "edu-s01-encode-lock-"));
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

test("checklist on EDU-S01 dest holds; --flip refused", () => {
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
