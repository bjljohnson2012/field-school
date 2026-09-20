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

const FIRST = "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4";
const CAPTIONS = "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4";
const LETTERBOX = "/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4";
const KARAOKE = "/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4";
const AUDIOBED = "/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4";
const STILLS = "/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20";

const SHA = {
  [FIRST]: "a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a",
  [CAPTIONS]: "ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211",
  [LETTERBOX]: "028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98",
  [KARAOKE]: "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f",
  [AUDIOBED]: "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f",
};

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("TypeCard is factory cream paper + gold rail; no Ernest PNG", () => {
  const layers = src("src", "layers.tsx");
  const card = layers.slice(layers.indexOf("export function TypeCard"), layers.indexOf("export function HeadFixture"));
  assert.match(card, /backgroundColor: cream/);
  assert.match(card, /borderLeft: `6px solid \$\{gold\}`/);
  assert.match(card, /padding: "24px 32px 28px"/);
  assert.doesNotMatch(card, /#2F6FED|#0066FF|mark.?blue/i);
  assert.doesNotMatch(layers, /cards\/ycjdt|ernest/i);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
});

test("OverlayLock stays VOX-S05 30px open tracking", () => {
  const layers = src("src", "layers.tsx");
  const lock = layers.slice(layers.indexOf("export function OverlayLock"), layers.indexOf("export function GoldRule"));
  assert.match(lock, /fontSize: 30/);
  assert.match(lock, /letterSpacing: "0.02em"/);
  assert.match(lock, /wordSpacing: "0.2em"/);
  assert.match(lock, /whiteSpace: "nowrap"/);
  assert.match(lock, /left: overlay.x - 520/);
  assert.doesNotMatch(lock, /fontSize: 22/);
  assert.doesNotMatch(layers, /letterSpacing: "-0.0/);
});

test("ORDER LOCK and antagonist VOX-S04 PASS stay", () => {
  const spine = src("src", "LessonSpine.tsx");
  assert.match(spine, /name="sting"/);
  assert.match(spine, /name="slate"/);
  assert.match(spine, /name="objective"/);
  assert.match(spine, /name="recap"/);
  assert.match(spine, /name="next-up"/);
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
  const note = src("antagonist-typecard-vox-s04.md");
  assert.match(note, /Dated \*\*2026-09-20\*\*/);
  assert.match(note, /VOX-S04: PASS/);
  assert.match(note, /verdict: PASS/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(note, /auto_flip: false/);
  assert.match(note, /remotion-typecard-vox-s04\/2026-09-20/);
  assert.doesNotMatch(note, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.match(src("..", "docs", "campus-runtime", "WAVE5.md"), /## VOX-S04 TypeCard \(PASS\)/);
  assert.match(src("README.md"), /antagonist-typecard-vox-s04\.md/);
});

test("prior encode dests stay distinct and untouched", () => {
  assert.notEqual(FIRST, CAPTIONS);
  assert.notEqual(FIRST, LETTERBOX);
  assert.notEqual(LETTERBOX, KARAOKE);
  assert.notEqual(KARAOKE, STILLS);
  for (const dest of [FIRST, CAPTIONS, LETTERBOX, KARAOKE, AUDIOBED]) {
    assert.equal(existsSync(dest), true, dest);
    assert.equal(sha256(dest), SHA[dest], dest);
  }
});

test("TypeCard stills land under the new dated dest", () => {
  for (const name of [
    "Opener-f30.png",
    "RecapCard-f144.png",
    "TalkingHeadCard-f90.png",
    "LessonSpine-f30.png",
    "LessonSpine-f330.png",
  ]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("cleaning checklist holds; --flip refused", () => {
  const checklist = join(here, "cleaning-checklist-lesson-spine.mjs");
  const flip = spawnSync(process.execPath, [checklist, "--dest", AUDIOBED, "--flip", "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(flip.status, 2);
  assert.match(flip.stdout, /flip_refused/);
  const pass = spawnSync(process.execPath, [checklist, "--dest", AUDIOBED, "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(pass.status, 0, pass.stderr);
  const body = JSON.parse(pass.stdout);
  assert.equal(body.verdict, "PASS");
  assert.equal(body.hold_cleaning, true);
  assert.equal(body.auto_flip, false);
});

test("render-lock still gates LessonSpine dry-run after TypeCard polish", () => {
  const dir = mkdtempSync(join(tmpdir(), "typecard-lock-"));
  const missingLock = join(dir, "absent.render.lock");
  const meminfo = join(dir, "meminfo");
  writeFileSync(meminfo, "MemAvailable: 8192000 kB\n");
  const ran = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--lock",
      missingLock,
      "--meminfo",
      meminfo,
      "--dry-run",
    ],
    {encoding: "utf8"},
  );
  assert.equal(ran.status, 0, ran.stderr);
  const body = JSON.parse(ran.stdout);
  assert.equal(body.ok, true);
  assert.equal(body.composition, "LessonSpine");
  assert.equal(body.concurrency, 2);
});
