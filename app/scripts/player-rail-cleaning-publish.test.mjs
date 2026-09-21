import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {cleaningAutoFlipReady} from "../src/lib/plates/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");
const MASTER_SHA = "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
const SOURCE = "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
const ARCHIVE = "/opt/cursor/artifacts/campus-lesson-spine-master/2026-09-21/LessonSpine.mp4";
const ANALOGY = "/opt/cursor/artifacts/lesson-spine-analogy-encode/2026-09-21/LessonSpine.mp4";
const ANALOGY_SHA = "a556a0b5a2beaec4b0cc44eadcbf6c092cd152a568282ce3eee06564be01af37";
const EVIDENCE = "/opt/cursor/artifacts/lesson-spine-evidence-encode/2026-09-21/LessonSpine.mp4";
const EVIDENCE_SHA = "5d0499f6cbff19149ce0b5da3c615a1ca0ab26fbbece2d9e26da0e78dd367c4b";
const RUBRIC = "/opt/cursor/artifacts/lesson-spine-rubric-encode/2026-09-21/LessonSpine.mp4";
const RUBRIC_SHA = "4aef4c713218247ebb4cad42b637f4b1331a02d6db4fcc13ac13e2bde156a337";
const THRESHOLD = "/opt/cursor/artifacts/lesson-spine-threshold-encode/2026-09-21/LessonSpine.mp4";
const THRESHOLD_SHA = "955f0256424fdc4ddb5ae5506a04a9ea877cb6a79ccb126ba1bb4884b9943a6f";
const SPECTRUM = "/opt/cursor/artifacts/lesson-spine-spectrum-encode/2026-09-21/LessonSpine.mp4";
const SPECTRUM_SHA = "496f506babd11a6e5247e87c3bbf926117b0de31feae5b6573fa891bdf6c68d0";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("Ready/HLS publish artifacts exist; master and priors untouched", () => {
  const playlist = join(root, "public/lessons/hls/LessonSpine.m3u8");
  const ready = join(root, "public/lessons/hls/ready.json");
  assert.equal(existsSync(playlist), true);
  assert.equal(existsSync(ready), true);
  assert.match(read("public/lessons/hls/LessonSpine.m3u8"), /#EXTM3U/);
  assert.match(read("public/lessons/hls/LessonSpine.m3u8"), /\.m4s|LessonSpine-init\.mp4/);
  assert.equal(existsSync(join(root, "public/lessons/hls/LessonSpine-000.ts")), false);
  const manifest = JSON.parse(read("public/lessons/hls/ready.json"));
  assert.equal(manifest.status, "Ready");
  assert.equal(manifest.kind, "HLS");
  assert.equal(manifest.distribute, false);
  assert.equal(manifest.master_sha256, MASTER_SHA);
  assert.match(manifest.launch, /CLOSED 0\/8/);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(ARCHIVE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("player rail prefers HLS then MP4; no Remotion npm", () => {
  const player = read("src/components/lesson-spine-player.tsx");
  const page = read("src/app/play/lesson-spine/page.tsx");
  const readyRoute = read("src/app/api/media/lesson-spine/ready/route.ts");
  const pkg = JSON.parse(read("package.json"));
  assert.match(player, /application\/vnd\.apple\.mpegurl/);
  assert.match(player, /\/lessons\/hls\/LessonSpine\.m3u8/);
  assert.match(player, /\/api\/media\/lesson-spine/);
  assert.match(player, /data-ready="hls"/);
  assert.match(player, /Ready · HLS/);
  assert.match(page, /Ready \/ HLS/);
  assert.match(page, new RegExp(MASTER_SHA));
  assert.match(readyRoute, /ready_manifest_missing|ready\.json/);
  assert.doesNotMatch(readyRoute, /requireMember|requireTeacher/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
  assert.equal(cleaningAutoFlipReady({checklistExit: 0, shipGreen: false, holdCleaning: true}), false);
});

test("WAVE5 STATUS cite play-rail Cleaning + Publish after PR 186; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  assert.match(wave5, /## LessonSpine play-rail Cleaning \+ Publish \(PASS\)/);
  assert.match(wave5, /PR 186 merge `b8ba687`/);
  assert.match(wave5, /\/lessons\/hls/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /LessonSpine play-rail Cleaning \+ Publish \*\*PASS\*\*/);
  assert.match(campus, /PR 186 merge `b8ba687`/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(rail, /Ready \/ HLS/);
  assert.match(rail, /cleaning-auto-flip-play-rail/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
});
