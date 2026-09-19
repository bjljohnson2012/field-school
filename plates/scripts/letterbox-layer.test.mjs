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

test("Letterbox is a reusable craft layer: ink bars, gold rule, close-in", () => {
  const layers = src("src", "layers.tsx");
  assert.match(layers, /export const LETTERBOX_H = 48/);
  assert.match(layers, /export function Letterbox/);
  assert.match(layers, /useCurrentFrame/);
  assert.match(layers, /TAKEOVER_EASE_FRAMES/);
  assert.match(layers, /interpolate\(frame, \[0, TAKEOVER_EASE_FRAMES\], \[0, LETTERBOX_H\]/);
  assert.match(layers, /backgroundColor: ink/);
  assert.match(layers, /backgroundColor: gold/);
  assert.match(layers, /bottom: LETTERBOX_H \+ 16/);
  assert.match(layers, /bottom: LETTERBOX_H \+ 140/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
});

test("LetterboxDemo registers 1920x1080@30 without touching spine order", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const demo = src("src", "LetterboxDemo.tsx");
  assert.match(rootTsx, /id="LetterboxDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.match(demo, /name="captions"/);
  assert.match(demo, /name="letterbox"/);
  assert.match(demo, /<Letterbox \/>/);
  assert.match(demo, /<CaptionsBand /);
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

test("layer order is bed → screen → head → lower third → captions → letterbox → audio", () => {
  const head = src("src", "TalkingHeadCard.tsx");
  const opener = src("src", "Opener.tsx");
  const demo = src("src", "LetterboxDemo.tsx");
  for (const blob of [head, opener, demo]) {
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
    assert.doesNotMatch(blob, /zIndex|z-index/);
  }
});

test("README and antagonist link letterbox; captions path exists", () => {
  const readme = src("README.md");
  assert.match(readme, /LetterboxDemo/);
  assert.match(readme, /antagonist-letterbox-layer\.md/);
  assert.match(
    readme,
    /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.equal(existsSync(join(root, "antagonist-letterbox-layer.md")), true);
  assert.equal(existsSync(join(root, "public", "captions", "letterbox-demo.json")), true);
  assert.match(src("AGENTS.md"), /LetterboxDemo/);
});

test("render-lock still gates LessonSpine dry-run after letterbox craft", () => {
  const dir = mkdtempSync(join(tmpdir(), "letterbox-lock-"));
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
