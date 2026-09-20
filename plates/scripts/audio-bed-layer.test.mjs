import assert from "node:assert/strict";
import {existsSync, mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");

const KARAOKE = "/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4";
const LETTERBOX = "/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4";
const FIRST = "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4";
const CAPTIONS = "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4";

test("AudioBed is a reusable silent fixture after letterbox", () => {
  const layers = src("src", "layers.tsx");
  assert.match(layers, /export function AudioBed/);
  assert.match(layers, /export const AUDIO_BED_FILE = "audio-bed-silence\.wav"/);
  assert.match(layers, /export const AUDIO_BED_VOLUME = 0/);
  assert.match(layers, /<Audio /);
  assert.match(layers, /staticFile\(AUDIO_BED_FILE\)/);
  assert.match(layers, /muted=\{muted\}/);
  assert.match(layers, /After captions, before audio/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
  assert.equal(existsSync(join(root, "public", "audio-bed-silence.wav")), true);
});

test("AudioBedDemo registers 1920x1080@30; LessonSpine ORDER LOCK intact", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const demo = src("src", "AudioBedDemo.tsx");
  const opener = src("src", "Opener.tsx");
  assert.match(rootTsx, /id="AudioBedDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.match(demo, /name="letterbox"/);
  assert.match(demo, /name="audio"/);
  assert.match(demo, /<AudioBed \/>/);
  assert.match(demo, /<Letterbox \/>/);
  assert.match(demo, /<CaptionsBand /);
  assert.match(opener, /<AudioBed \/>/);
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
});

test("layer order stays bed → screen → head → lower third → captions → letterbox → audio", () => {
  const opener = src("src", "Opener.tsx");
  const demo = src("src", "AudioBedDemo.tsx");
  for (const blob of [opener, demo]) {
    const order = [
      'name="bed"',
      'name="screen"',
      'name="talking-head card"',
      'name="lower third"',
      'name="captions"',
      'name="letterbox"',
      'name="audio"',
    ].map((n) => blob.indexOf(n));
    for (let i = 1; i < order.length; i++) {
      assert.ok(order[i - 1] >= 0 && order[i] > order[i - 1], `layer ${i}`);
    }
    assert.match(blob, /<AudioBed \/>/);
    assert.doesNotMatch(blob, /zIndex|z-index/);
  }
});

test("README and antagonist link audio bed; prior encode dests stay distinct", () => {
  const readme = src("README.md");
  assert.match(readme, /AudioBedDemo/);
  assert.match(readme, /antagonist-audio-bed-layer\.md/);
  assert.match(
    readme,
    /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.equal(existsSync(join(root, "antagonist-audio-bed-layer.md")), true);
  assert.match(src("AGENTS.md"), /AudioBedDemo/);
  assert.notEqual(KARAOKE, LETTERBOX);
  assert.notEqual(KARAOKE, FIRST);
  assert.notEqual(KARAOKE, CAPTIONS);
  assert.match(readme, /9f89f9a9/);
  assert.match(readme, /028d16e4/);
});

test("render-lock still gates LessonSpine dry-run after audio bed", () => {
  const dir = mkdtempSync(join(tmpdir(), "audio-bed-lock-"));
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
  const just = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--cap-id",
      "27pn9xs0zk8a73g",
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
