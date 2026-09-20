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
const NEW_DEST = "/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4";
const OLD_ENCODE = "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4";
const OLD_CAPTIONS =
  "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4";
const OLD_LETTERBOX =
  "/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4";

test("wordClock marks one active word gold #C4A35A", () => {
  const clock = src("src", "wordClock.ts");
  assert.match(clock, /export const ACTIVE_WORD_GOLD = "#C4A35A"/);
  assert.match(clock, /export function wordClock/);
  assert.match(clock, /export function wordState/);
  assert.match(clock, /export function wordColor/);
  assert.match(clock, /"unspoken" \| "active" \| "spoken"/);
  assert.match(clock, /if \(state === "active"\) return gold/);
  assert.match(clock, /return stone/);
  assert.match(src("src", "brand.ts"), /export const gold = "#C4A35A"/);
  assert.match(src("src", "brand.ts"), /export const stone = "#7a746a"/);
});

test("CaptionsBand uses wordClock + gold tick; Karaoke still aliases the band", () => {
  const layers = src("src", "layers.tsx");
  assert.match(layers, /import \{wordClock, wordColor\} from "\.\/wordClock"/);
  assert.match(layers, /wordClock\(captions, nowMs\)/);
  assert.match(layers, /wordColor\(word\.state\)/);
  assert.match(layers, /borderBottom: active \? `3px solid \$\{gold\}`/);
  assert.match(layers, /export function Karaoke/);
  assert.match(layers, /return <CaptionsBand captions=\{captions\} \/>/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
});

test("CaptionsDemo and LessonSpine keep letterbox stack; ORDER LOCK unchanged", () => {
  const demo = src("src", "CaptionsDemo.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const head = src("src", "TalkingHeadCard.tsx");
  assert.match(demo, /<CaptionsBand captions=\{DEMO_CAPTIONS\}/);
  assert.match(demo, /name="captions"/);
  assert.match(demo, /name="letterbox"/);
  assert.match(demo, /<OverlayLock/);
  assert.match(head, /<Karaoke captions=\{captions\}/);
  assert.match(head, /<LowerThird name=\{name\} role=\{role\}/);
  assert.match(head, /<Letterbox \/>/);
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
});

test("new karaoke dest is not Just, Aug 30, or a prior LessonSpine encode", () => {
  assert.equal(existsSync(join(root, "encode-lesson-spine-karaoke-gold.md")), true);
  assert.equal(existsSync(join(root, "antagonist-captions-karaoke-gold.md")), true);
  assert.doesNotMatch(NEW_DEST, /27pn9xs0zk8a73g/);
  assert.doesNotMatch(NEW_DEST, /everything-made-up\.mp4/);
  assert.notEqual(NEW_DEST, OLD_ENCODE);
  assert.notEqual(NEW_DEST, OLD_CAPTIONS);
  assert.notEqual(NEW_DEST, OLD_LETTERBOX);
  assert.match(src("README.md"), /encode-lesson-spine-karaoke-gold/);
  assert.match(src("README.md"), /antagonist-captions-karaoke-gold/);
});

test("render-lock dry-run forwards the karaoke dest and refuses Just", () => {
  const dir = mkdtempSync(join(tmpdir(), "karaoke-gold-lock-"));
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
