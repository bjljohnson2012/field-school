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

test("OverlayLock title is 30px with open tracking; no smash spacing", () => {
  const layers = src("src", "layers.tsx");
  const lock = layers.slice(layers.indexOf("export function OverlayLock"), layers.indexOf("export function GoldRule"));
  assert.match(lock, /fontSize: 30/);
  assert.match(lock, /letterSpacing: "0.02em"/);
  assert.match(lock, /wordSpacing: "0.2em"/);
  assert.match(lock, /whiteSpace: "nowrap"/);
  assert.match(lock, /left: overlay.x - 520/);
  assert.doesNotMatch(lock, /fontSize: 22/);
  assert.doesNotMatch(layers, /letterSpacing: "-0.0/);
  assert.match(layers, /<Img/);
  assert.match(layers, /staticFile\("isolated-seal.svg"\)/);
});

test("TypeCard titles keep Fraunces tracking; no Ernest PNG required", () => {
  const layers = src("src", "layers.tsx");
  const title = layers.slice(layers.indexOf("export function Title"), layers.indexOf("export function Claim"));
  const claim = layers.slice(layers.indexOf("export function Claim"));
  assert.match(title, /fontSize: 56/);
  assert.match(title, /letterSpacing: "0.01em"/);
  assert.match(title, /wordSpacing: "0.16em"/);
  assert.match(claim, /wordSpacing: "0.14em"/);
  assert.doesNotMatch(layers, /cards\/ycjdt|ernest/i);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
});

test("ORDER LOCK and seal lock stay", () => {
  const spine = src("src", "LessonSpine.tsx");
  const brand = src("src", "brand.ts");
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
  assert.match(brand, /x: 1576/);
  assert.match(brand, /y: 24/);
  assert.match(brand, /w: 80/);
  assert.match(brand, /h: 64/);
});

test("README and antagonist cite VOX-S05 polish", () => {
  const readme = src("README.md");
  assert.match(readme, /antagonist-soft-polish-vox-s05\.md/);
  assert.match(
    readme,
    /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.equal(existsSync(join(root, "antagonist-soft-polish-vox-s05.md")), true);
  assert.match(src("antagonist-soft-polish-vox-s05.md"), /VOX-S05/);
  assert.match(src("antagonist-soft-polish-vox-s05.md"), /verdict: PASS/);
});

test("render-lock still gates LessonSpine dry-run after polish", () => {
  const dir = mkdtempSync(join(tmpdir(), "polish-lock-"));
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
