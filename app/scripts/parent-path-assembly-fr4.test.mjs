import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  assembleHirePathItems,
  assembleSupervisedPath,
  selectSupervisedPath,
} from "../src/lib/progress/supervised-path.ts";

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

test("Path assembles under the selected Child from parent intent", () => {
  const play = selectSupervisedPath("play-child");
  assert.equal(play.selected?.id, "play-child");
  assert.equal(play.selected?.kind, "child");
  assert.equal(play.selected?.login, "none");
  assert.equal(play.selected?.user, false);
  assert.match(play.selected?.items[0]?.title || "", /LessonSpine/);
  assert.equal(play.selected?.items[0]?.source, "catalog");
  assert.match(play.selected?.intent.subjects.join(" ") || "", /LessonSpine/);
  assert.equal(play.distribute, false);
  assert.equal(play.launch, "CLOSED 0/8");
  const hire = selectSupervisedPath("hire-child");
  assert.equal(hire.selected?.id, "hire-child");
  assert.match(hire.selected?.items[0]?.title || "", /Learn with Ben/);
  const items = assembleHirePathItems({
    goals: ["Hold the rail from parent intent"],
    subjects: ["LessonSpine"],
    themes: ["parent-owned plan"],
    timeHorizon: "this hire",
    constraints: ["Child is not a User"],
  });
  assert.equal(items[0].title, "LessonSpine Ready / HLS");
  assert.equal(items[0].play, "/play/lesson-spine");
  const dest = join(mkdtempSync(join(tmpdir(), "supervised-path-")), "supervised-path.json");
  process.env.SUPERVISED_PATH_PATH = dest;
  const assembled = assembleSupervisedPath("play-child");
  assert.equal(assembled.ok, true);
  assert.equal(assembled.selected?.id, "play-child");
  assert.equal(assembled.selected?.user, false);
  assert.match(assembled.selected?.items[0]?.title || "", /LessonSpine/);
  const unknown = assembleSupervisedPath("not-a-child");
  assert.equal(unknown.ok, false);
  delete process.env.SUPERVISED_PATH_PATH;
  rmSync(dirname(dest), { recursive: true, force: true });
});

test("FR-4 campus surface does not steal family LIVE or children-database", () => {
  const page = read("src/app/path/page.tsx");
  const ui = read("src/components/fr-4-parent-path.tsx");
  const api = read("src/app/api/progress/path/route.ts");
  const lib = read("src/lib/progress/supervised-path.ts");
  const family = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const childrenPage = read("src/app/children/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(page, /Fr4ParentPath/);
  assert.match(ui, /data-path="fr-4-fr-3"/);
  assert.match(ui, /data-selected-child/);
  assert.match(ui, /data-intent-bound="fr-3"/);
  assert.match(ui, /\/api\/progress\/path/);
  assert.match(api, /assembleSupervisedPath/);
  assert.match(lib, /FR-4/);
  assert.match(lib, /FR-3/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(childrenPage, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(
    ui + lib + api,
    /family-v1-home|children-database|bc-4765f2f0|\/api\/curriculum|curriculum_paths/,
  );
  assert.doesNotMatch(ui + lib, /Gym|Foundry|Retainer|\$150|\$250|\$500/);
  assert.match(family, /Now \/ Confidence \/ Next/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
});

test("master and priors untouched after parent-path assembly", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Parent-path assembly after PR 195; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  assert.match(wave5, /## Parent-path assembly \(PASS\)/);
  assert.match(wave5, /PR 195 merge `d8f9d00`/);
  assert.match(wave5, /\/path/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Parent-path assembly \*\*PASS\*\*/);
  assert.match(campus, /PR 195 merge `d8f9d00`/);
  assert.match(campus, /Parent-owned intent \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Parent-path assembly **PASS**. PR 195 merge `d8f9d00`.").length - 1,
    3,
  );
  assert.equal(
    campus.split("Parent-owned intent **PASS**. PR 194 merge `3322e52`.").length - 1,
    3,
  );
  assert.match(rail, /\/path/);
  assert.match(rail, /Parent-path assembly/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Parent-path assembly FR-4/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
});
