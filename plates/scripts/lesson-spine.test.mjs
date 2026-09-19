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

test("spine frame math is 10+8+6+10+7 at 30fps = 1230", () => {
  const math = src("src", "lessonSpine.ts");
  assert.match(math, /id: "sting".*plate: "Opener".*durationSec: 10/);
  assert.match(math, /id: "slate".*plate: "TalkingHeadCard".*durationSec: 8/);
  assert.match(math, /id: "objective".*plate: "DefinitionBoard".*durationSec: 6/);
  assert.match(math, /id: "recap".*plate: "RecapCard".*durationSec: 10/);
  assert.match(math, /id: "nextUp".*plate: "QuizBumper".*durationSec: 7/);
  assert.equal(10 * 30 + 8 * 30 + 6 * 30 + 10 * 30 + 7 * 30, 1230);
  assert.equal(1230 / 30, 41);
  assert.deepEqual(
    [0, 300, 540, 720, 1020],
    [0, 10 * 30, 10 * 30 + 8 * 30, 10 * 30 + 8 * 30 + 6 * 30, 10 * 30 + 8 * 30 + 6 * 30 + 10 * 30],
  );
  assert.match(src("src", "Root.tsx"), /durationInFrames=\{1230\}/);
  assert.match(src("src", "sceneMotionMath.ts"), /export const GLIDE_FRAMES = 24/);
  assert.match(src("src", "sceneMotionMath.ts"), /export const TAKEOVER_HOLD_FRAMES = 12/);
  assert.match(src("src", "sceneMotionMath.ts"), /export const TAKEOVER_EASE_FRAMES = 18/);
});

test("LessonSpine registers and sequences existing plates", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.match(spine, /name="sting"/);
  assert.match(spine, /name="slate"/);
  assert.match(spine, /name="objective"/);
  assert.match(spine, /name="recap"/);
  assert.match(spine, /name="next-up"/);
  assert.match(spine, /<Opener /);
  assert.match(spine, /<TalkingHeadCard /);
  assert.match(spine, /<DefinitionBoard /);
  assert.match(spine, /<RecapCard /);
  assert.match(spine, /<QuizBumper /);
  assert.doesNotMatch(spine, /staticFile\("a_roll/);
  assert.doesNotMatch(spine, /27pn9xs0zk8a73g/);
});

test("README and antagonist cite the spine and the only bar", () => {
  const readme = src("README.md");
  assert.match(readme, /LessonSpine/);
  assert.match(readme, /antagonist-lesson-spine\.md/);
  assert.match(readme, /docs\/remotion-vox-standards\.md/);
  assert.match(
    readme,
    /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.equal(existsSync(join(root, "antagonist-lesson-spine.md")), true);
  assert.equal(existsSync(join(root, "encode-lesson-spine.md")), true);
  assert.match(src("antagonist-lesson-spine.md"), /docs\/remotion-vox-standards\.md/);
  assert.match(src("AGENTS.md"), /LessonSpine/);
  assert.doesNotMatch(src("src", "lessonSpine.ts"), /Opener→DefinitionBoard→TalkingHeadCard/);
});

test("render-lock still gates LessonSpine dry-run", () => {
  const dir = mkdtempSync(join(tmpdir(), "spine-lock-"));
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

test("render-plate dry-run forwards a new dated dest and still refuses Just", () => {
  const dir = mkdtempSync(join(tmpdir(), "spine-dest-"));
  const missingLock = join(dir, "absent.render.lock");
  const meminfo = join(dir, "meminfo");
  const dated = join(dir, "2026-09-19", "LessonSpine.mp4");
  writeFileSync(meminfo, "MemAvailable: 8192000 kB\n");
  const ok = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--dest",
      dated,
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
  assert.equal(body.dest, dated);
  const just = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--cap-id",
      "27pn9xs0zk8a73g",
      "--dest",
      dated,
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
