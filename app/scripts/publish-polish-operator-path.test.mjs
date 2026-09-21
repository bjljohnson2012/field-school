import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");
const MASTER_SHA = "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
const SOURCE = "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
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

test("Publish polish evidence rows exist on Ready HLS dest", () => {
  const polish = JSON.parse(read("public/lessons/hls/publish-polish.json"));
  const ready = JSON.parse(read("public/lessons/hls/ready.json"));
  const lib = read("src/lib/player/publish-polish.ts");
  const route = read("src/app/api/media/lesson-spine/publish/route.ts");
  const readyRoute = read("src/app/api/media/lesson-spine/ready/route.ts");
  const page = read("src/app/operator/publish/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(polish.published, true);
  assert.equal(polish.polish, true);
  assert.equal(polish.distribute, false);
  assert.equal(polish.launch, "CLOSED 0/8");
  assert.equal(polish.master_sha256, MASTER_SHA);
  assert.equal(polish.rows.length >= 1, true);
  assert.equal(polish.rows[0].dest_sha256, MASTER_SHA);
  assert.equal(polish.rows[0].distribute, false);
  assert.equal(ready.status, "Ready");
  assert.equal(ready.published, true);
  assert.equal(ready.publish, "polished");
  assert.equal(ready.distribute, false);
  assert.match(ready.launch, /CLOSED 0\/8/);
  assert.match(lib, /distribute_held/);
  assert.match(lib, /dest_sha_mismatch/);
  assert.match(lib, /polishReadyFields/);
  assert.match(lib, /PUBLISH_POLISH_LOCKED_SHA256/);
  assert.match(route, /readPublishPolish/);
  assert.match(route, /recordPublishPolish/);
  assert.match(route, /isStaffEmail/);
  assert.match(route, /operator_only/);
  assert.doesNotMatch(route, /requireMember|requireTeacher/);
  assert.match(readyRoute, /polishReadyFields/);
  assert.match(page, /data-publish-polish="operator"/);
  assert.match(page, /Distribute stays off|Distribute/);
  assert.match(page, /Launch stays closed|CLOSED 0\/8/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
});

test("master and priors untouched after Publish polish", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Publish polish after PR 190; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  assert.match(wave5, /## Publish polish operator path \(PASS\)/);
  assert.match(wave5, /PR 190 merge `38912ed`/);
  assert.match(wave5, /\/operator\/publish/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Publish polish operator path \*\*PASS\*\*/);
  assert.match(campus, /PR 190 merge `38912ed`/);
  assert.match(campus, /FR-KB-3 metering UI \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Publish polish operator path **PASS**. PR 190 merge `38912ed`.").length - 1,
    3,
  );
  assert.match(rail, /\/operator\/publish/);
  assert.match(rail, /publish-polish/);
  assert.match(gate, /\*\*0\*\*/);
  assert.match(gate, /\*\*CLOSED\*\*/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Play-rail Publish polish/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
});
