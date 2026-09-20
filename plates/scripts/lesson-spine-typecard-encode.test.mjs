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
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4";
const NEW_SHA = "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0";
const OLD_ENCODE = "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4";
const OLD_CAPTIONS =
  "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4";
const OLD_LETTERBOX =
  "/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4";
const OLD_KARAOKE = "/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4";
const OLD_AUDIOBED =
  "/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4";

const SHA = {
  [OLD_ENCODE]: "a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a",
  [OLD_CAPTIONS]: "ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211",
  [OLD_LETTERBOX]: "028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98",
  [OLD_KARAOKE]: "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f",
  [OLD_AUDIOBED]: "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f",
};

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("LessonSpine plates keep TypeCard + full stack; ORDER LOCK unchanged", () => {
  const def = src("src", "DefinitionBoard.tsx");
  const layers = src("src", "layers.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const readme = src("README.md");
  assert.match(def, /<TypeCard /);
  assert.match(def, /<AudioBed \/>/);
  assert.match(def, /<Letterbox \/>/);
  assert.match(def, /<Karaoke captions=\{captions\}/);
  assert.match(def, /<LowerThird /);
  assert.match(def, /<OverlayLock overlay=\{overlay\}/);
  const card = layers.slice(layers.indexOf("export function TypeCard"), layers.indexOf("export function HeadFixture"));
  assert.match(card, /backgroundColor: cream/);
  assert.match(card, /borderLeft: `6px solid \$\{gold\}`/);
  assert.match(layers, /fontSize: 30/);
  assert.match(layers, /letterSpacing: "0\.02em"/);
  assert.match(layers, /export function AudioBed/);
  assert.match(layers, /export function Letterbox/);
  assert.match(layers, /export function CaptionsBand/);
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
  assert.match(
    readme,
    /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.match(src("encode-lesson-spine-typecard.md"), /lesson-spine-typecard-encode\/2026-09-20/);
  assert.match(src("encode-lesson-spine-typecard.md"), /27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0/);
  assert.match(src("..", "docs", "campus-runtime", "WAVE5.md"), /TypeCard LessonSpine encode dest/);
  assert.match(src("antagonist-lesson-spine-typecard-encode.md"), /VOX-S04: PASS/);
  assert.match(src("antagonist-lesson-spine-typecard-encode.md"), /hold_cleaning: true/);
  assert.doesNotMatch(src("antagonist-lesson-spine-typecard-encode.md"), /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.notEqual(NEW_DEST, OLD_ENCODE);
  assert.notEqual(NEW_DEST, OLD_CAPTIONS);
  assert.notEqual(NEW_DEST, OLD_LETTERBOX);
  assert.notEqual(NEW_DEST, OLD_KARAOKE);
  assert.notEqual(NEW_DEST, OLD_AUDIOBED);
});

test("new dest exists with TypeCard sha256; prior dests untouched", () => {
  assert.equal(existsSync(NEW_DEST), true);
  assert.equal(sha256(NEW_DEST), NEW_SHA);
  assert.notEqual(NEW_SHA, SHA[OLD_KARAOKE]);
  for (const dest of [OLD_ENCODE, OLD_CAPTIONS, OLD_LETTERBOX, OLD_KARAOKE, OLD_AUDIOBED]) {
    assert.equal(existsSync(dest), true, dest);
    assert.equal(sha256(dest), SHA[dest], dest);
  }
  assert.equal(
    existsSync("/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine-objective-f570.png"),
    true,
  );
});

test("render-lock dry-run forwards the TypeCard dest and refuses Just", () => {
  const dir = mkdtempSync(join(tmpdir(), "typecard-encode-lock-"));
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
  assert.equal(body.concurrency, 2);
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

test("cleaning checklist holds; --flip refused", () => {
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

test("new dest is not Just, Aug 30, or a prior LessonSpine encode", () => {
  assert.equal(existsSync(join(root, "encode-lesson-spine-typecard.md")), true);
  assert.doesNotMatch(NEW_DEST, /27pn9xs0zk8a73g/);
  assert.doesNotMatch(NEW_DEST, /everything-made-up\.mp4/);
  assert.doesNotMatch(NEW_DEST, /lesson-spine-encode\/2026-09-19/);
  assert.doesNotMatch(NEW_DEST, /lesson-spine-reencode-captions\/2026-09-19/);
  assert.doesNotMatch(NEW_DEST, /lesson-spine-letterbox-encode\/2026-09-20/);
  assert.doesNotMatch(NEW_DEST, /lesson-spine-karaoke-gold\/2026-09-20/);
  assert.doesNotMatch(NEW_DEST, /lesson-spine-audiobed-encode\/2026-09-20/);
  assert.match(src("README.md"), /encode-lesson-spine-typecard/);
  assert.equal(existsSync(join(root, "antagonist-lesson-spine-typecard-encode.md")), true);
});
