import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const script = join(app, "deploy", "overlay-player-rail.sh");

test("overlay-player-rail pack is HTML5 player only", () => {
  const out = mkdtempSync(join(tmpdir(), "player-rail-pack-"));
  const ran = spawnSync("bash", [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      PACK_ONLY: "1",
      PACK_OUT_DIR: out,
      STAMP: "20260921TTEST",
      MAIN_SHA: "b34f303e228174cb099765ead8680e11a2bea0fe",
    },
  });
  assert.equal(ran.status, 0, ran.stderr + ran.stdout);
  assert.match(ran.stdout, /sha256=/);
  const tarPath = join(out, "player-rail-campus-pack-20260921TTEST.tar.gz");
  const members = spawnSync("tar", ["-tzf", tarPath], { encoding: "utf8" });
  assert.equal(members.status, 0, members.stderr);
  const list = members.stdout;
  assert.match(list, /src\/app\/play\/lesson-spine\/page\.tsx/);
  assert.match(list, /src\/app\/api\/media\/lesson-spine\/route\.ts/);
  assert.match(list, /src\/components\/lesson-spine-player\.tsx/);
  assert.match(list, /src\/components\/lesson-spine-parent-session\.tsx/);
  assert.match(list, /src\/components\/lesson-spine-hire-path\.tsx/);
  assert.match(list, /src\/components\/fr-kb-3-metering\.tsx/);
  assert.match(list, /src\/app\/metering\/page\.tsx/);
  assert.match(list, /src\/lib\/credits\/metering-display\.ts/);
  assert.match(list, /public\/lessons\/LessonSpine\.mp4/);
  assert.match(list, /public\/lessons\/hls\/LessonSpine\.m3u8/);
  assert.match(list, /public\/lessons\/hls\/ready\.json/);
  assert.doesNotMatch(list, /LessonSpine-\d+\.ts/);
  assert.match(list, /src\/app\/api\/media\/lesson-spine\/ready\/route\.ts/);
  assert.match(list, /src\/lib\/player\/publish-polish\.ts/);
  assert.match(list, /src\/app\/api\/media\/lesson-spine\/publish\/route\.ts/);
  assert.match(list, /src\/app\/operator\/publish\/page\.tsx/);
  assert.match(list, /public\/lessons\/hls\/publish-polish\.json/);
  assert.match(list, /src\/lib\/player\/launch-gate\.ts/);
  assert.match(list, /src\/app\/api\/media\/lesson-spine\/launch-gate\/route\.ts/);
  assert.match(list, /src\/app\/operator\/launch-gate\/page\.tsx/);
  assert.match(list, /public\/lessons\/hls\/launch-gate\.json/);
  assert.match(list, /src\/lib\/billing\/hire-activation\.ts/);
  assert.match(list, /src\/app\/api\/stripe\/webhook\/route\.ts/);
  assert.match(list, /src\/app\/api\/billing\/hire\/route\.ts/);
  assert.match(list, /src\/app\/operator\/hire\/page\.tsx/);
  assert.match(list, /public\/lessons\/hls\/hire-activation\.json/);
  assert.doesNotMatch(list, /family-v1-home|children-database|vite\.config|src\/routes\/|remotion/);
  assert.doesNotMatch(list, /src\/app\/o\/\[slug\]\/page\.tsx/);
});

test("overlay script refuses a TanStack root and keeps family hashes", () => {
  const src = readFileSync(script, "utf8");
  assert.match(src, /vite\.config\.ts/);
  assert.match(src, /src\/routes/);
  assert.match(src, /family-v1-home/);
  assert.match(src, /children-database/);
  assert.match(src, /--no-deps app/);
  assert.match(src, /without a deploy\.sh wipe/);
  assert.match(src, /\$HOME\/\.ssh\/vps_deploy/);
  assert.doesNotMatch(src, /2\.24\.64\.248/);
  assert.doesNotMatch(src, /AUTH_URL=/);
});
