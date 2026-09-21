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

test("Launch-gate evidence rows cite landed unlocks without inventing 8/8", () => {
  const gate = JSON.parse(read("public/lessons/hls/launch-gate.json"));
  const lib = read("src/lib/player/launch-gate.ts");
  const route = read("src/app/api/media/lesson-spine/launch-gate/route.ts");
  const page = read("src/app/operator/launch-gate/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(gate.launch, "CLOSED 0/8");
  assert.equal(gate.pass, 0);
  assert.equal(gate.nodes, 8);
  assert.equal(gate.product, "HELD");
  assert.equal(gate.distribute, false);
  assert.equal(gate.master_sha256, MASTER_SHA);
  assert.equal(gate.rows.length, 5);
  for (const row of gate.rows) {
    assert.equal(row.landed, true);
    assert.equal(row.launch_pass, false);
  }
  assert.equal(gate.rows.map((row) => row.id).join(","), "play-rail,auth-signed-in,stripe-three-plan,metering-fr-kb-3,publish-polish");
  assert.match(lib, /launch_pass: false/);
  assert.match(lib, /CLOSED 0\/8/);
  assert.match(route, /readLaunchGate/);
  assert.doesNotMatch(route, /requireMember|requireTeacher|isStaffEmail/);
  assert.match(page, /data-launch-gate="operator"/);
  assert.match(page, /data-launch=\{evidence\.launch\}/);
  assert.match(page, /Eight nodes \(all HELD\)/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
  assert.doesNotMatch(page + lib, /Gym|Foundry|Retainer/);
});

test("master and priors untouched after Launch-gate evidence rows", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Launch-gate evidence after PR 191; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  assert.match(wave5, /## Launch-gate evidence rows \(PASS\)/);
  assert.match(wave5, /PR 191 merge `aa47d07`/);
  assert.match(wave5, /\/operator\/launch-gate/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Launch-gate evidence rows \*\*PASS\*\*/);
  assert.match(campus, /PR 191 merge `aa47d07`/);
  assert.match(campus, /Publish polish operator path \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Launch-gate evidence rows **PASS**. PR 191 merge `aa47d07`.").length - 1,
    3,
  );
  assert.match(rail, /\/operator\/launch-gate/);
  assert.match(rail, /launch_pass:false/);
  assert.match(gate, /## Hire-path evidence rows \(not a launch PASS\)/);
  assert.match(gate, /\*\*0\*\*/);
  assert.match(gate, /\*\*CLOSED\*\*/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Offer \| HELD/);
  assert.match(gate, /PR 191 merge `aa47d07`/);
  assert.match(gate, /launch_pass|Launch node PASS/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS|Offer \| PASS/i);
});
