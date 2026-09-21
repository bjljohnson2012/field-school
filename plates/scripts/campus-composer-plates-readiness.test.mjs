import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app");
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

test("GET /api/composer is a Wave3 readiness route, not a missing path", () => {
  const route = read("src/app/api/composer/route.ts");
  const catalog = read("src/app/api/composer/catalog/route.ts");
  const plates = read("src/app/api/plates/route.ts");
  const overlay = read("deploy/overlay-player-rail.sh");
  assert.match(route, /export async function GET/);
  assert.match(route, /wave3: "LIVE"/);
  assert.match(route, /composer: "ready"/);
  assert.match(route, /CLOSED 0\/8/);
  assert.match(route, /distribute: false/);
  assert.match(catalog, /requireMember/);
  assert.match(plates, /ready: true/);
  assert.match(plates, /requireMember/);
  assert.match(overlay, /src\/app\/api\/composer\/route\.ts/);
  assert.match(overlay, /src\/app\/api\/plates\/route\.ts/);
  assert.doesNotMatch(route + plates, /8\/8 PASS|launch OPEN/i);
});

test("composer and plates readiness do not steal family LIVE", () => {
  const route = read("src/app/api/composer/route.ts");
  const plates = read("src/app/api/plates/route.ts");
  const overlay = read("deploy/overlay-player-rail.sh");
  const family = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const childrenPage = read("src/app/children/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(childrenPage, /knowledge brain/i);
  assert.doesNotMatch(
    route + plates,
    /family-v1-home|children-database|bc-4765f2f0|knowledge_brains|growth_units|Gym|Foundry|Retainer|\$150|\$250|\$500/,
  );
  const members = overlay.match(/MEMBERS=\(([\s\S]*?)\)/)?.[1] ?? "";
  assert.match(members, /src\/app\/api\/composer\/route\.ts/);
  assert.match(members, /src\/app\/api\/plates\/route\.ts/);
  assert.doesNotMatch(members, /family-v1-home|children-database/);
  assert.match(family, /Now \/ Confidence \/ Next/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
});

test("master and priors untouched after composer plates readiness", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Composer plates readiness after PR 203 merge; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  const wave3 = readRepo("docs/campus-runtime/WAVE3.md");
  assert.match(wave5, /## Composer plates readiness \(PASS\)/);
  assert.match(wave5, /PR 203 merge `9086cc8`/);
  assert.match(wave5, /\/api\/composer/);
  assert.match(wave5, /\/api\/plates/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Composer plates readiness \*\*PASS\*\*/);
  assert.match(campus, /PR 203 merge `9086cc8`/);
  assert.match(campus, /Brain confidence \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Composer plates readiness **PASS**. PR 203 merge `9086cc8`.").length - 1,
    3,
  );
  assert.equal(
    campus.split("Brain confidence **PASS**. PR 202 merge `ce32eef`.").length - 1,
    3,
  );
  assert.match(rail, /Composer plates readiness/);
  assert.match(rail, /\/api\/composer/);
  assert.match(rail, /\/api\/plates/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Composer plates readiness/);
  assert.match(wave3, /\/api\/composer/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
  assert.doesNotMatch(wave5 + campus, /cutover done|campus package extracted/i);
});
