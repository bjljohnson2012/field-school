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

test("CaptionsBand and LowerThird craft exist; Karaoke aliases the band", () => {
  const layers = src("src", "layers.tsx");
  assert.match(layers, /export function LowerThird/);
  assert.match(layers, /export function CaptionsBand/);
  assert.match(layers, /export function Karaoke/);
  assert.match(layers, /useCurrentFrame/);
  assert.match(layers, /glideCard/);
  assert.match(layers, /displayFace/);
  assert.match(layers, /wordClock/);
  assert.match(layers, /wordColor/);
  assert.match(layers, /3px solid \$\{gold\}/);
  assert.match(layers, /whiteSpace: "pre"/);
  assert.match(layers, /return <CaptionsBand captions=\{captions\} \/>/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
});

test("demo compositions register 1920x1080@30 without touching spine order", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  assert.match(rootTsx, /id="LowerThirdDemo"/);
  assert.match(rootTsx, /id="CaptionsDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.match(src("src", "LowerThirdDemo.tsx"), /name="lower third"/);
  assert.match(src("src", "CaptionsDemo.tsx"), /name="captions"/);
  assert.match(src("src", "CaptionsDemo.tsx"), /<CaptionsBand /);
  assert.match(src("src", "TalkingHeadCard.tsx"), /<LowerThird name=\{name\} role=\{role\}/);
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
  const demo = src("src", "CaptionsDemo.tsx");
  for (const blob of [head, demo]) {
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

test("README and antagonist link captions / lower third; captions path exists", () => {
  const readme = src("README.md");
  assert.match(readme, /CaptionsDemo/);
  assert.match(readme, /LowerThirdDemo/);
  assert.match(readme, /antagonist-captions-lower-third\.md/);
  assert.match(
    readme,
    /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.equal(existsSync(join(root, "antagonist-captions-lower-third.md")), true);
  assert.equal(existsSync(join(root, "public", "captions", "captions-demo.json")), true);
  assert.match(src("AGENTS.md"), /CaptionsDemo/);
  assert.match(src("AGENTS.md"), /LowerThirdDemo/);
});

test("render-lock still gates LessonSpine dry-run after captions craft", () => {
  const dir = mkdtempSync(join(tmpdir(), "captions-lock-"));
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
