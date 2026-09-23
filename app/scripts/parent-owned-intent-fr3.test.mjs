import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  selectSupervisedIntent,
  writeSupervisedIntent,
} from "../src/lib/progress/supervised-intent.ts";

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

test("Parent can set and see intent under the selected Child", () => {
  const play = selectSupervisedIntent("play-child");
  assert.equal(play.selected?.id, "play-child");
  assert.equal(play.selected?.kind, "child");
  assert.equal(play.selected?.login, "none");
  assert.equal(play.selected?.user, false);
  assert.match(play.selected?.goals.join(" ") || "", /parent intent/i);
  assert.equal(play.distribute, false);
  assert.equal(play.launch, "CLOSED 0/8");
  const hire = selectSupervisedIntent("hire-child");
  assert.equal(hire.selected?.id, "hire-child");
  assert.match(hire.selected?.subjects.join(" ") || "", /Learn with Ben/);
  const dest = join(mkdtempSync(join(tmpdir(), "supervised-intent-")), "supervised-intent.json");
  process.env.SUPERVISED_INTENT_PATH = dest;
  const written = writeSupervisedIntent("play-child", {
    goals: ["Hold the rail from parent intent"],
    subjects: [],
    themes: [],
    timeHorizon: "this hire",
    constraints: ["Child is not a User"],
  });
  assert.equal(written.ok, true);
  assert.equal(written.selected?.id, "play-child");
  assert.equal(written.selected?.user, false);
  assert.equal(written.selected?.goals[0], "Hold the rail from parent intent");
  const unknown = writeSupervisedIntent("not-a-child", {
    goals: ["no"],
    subjects: [],
    themes: [],
    timeHorizon: "",
    constraints: [],
  });
  assert.equal(unknown.ok, false);
  delete process.env.SUPERVISED_INTENT_PATH;
  rmSync(dirname(dest), { recursive: true, force: true });
});

test("FR-3 campus surface does not steal family LIVE or children-database", () => {
  const page = read("src/app/intent/page.tsx");
  const ui = read("src/components/fr-3-parent-intent.tsx");
  const api = read("src/app/api/progress/intent/route.ts");
  const lib = read("src/lib/progress/supervised-intent.ts");
  const family = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const childrenPage = read("src/app/children/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(page, /Fr3ParentIntent/);
  assert.match(ui, /data-intent="fr-3-fr-2"/);
  assert.match(ui, /data-selected-child/);
  assert.match(ui, /data-intent-field="goals"/);
  assert.match(ui, /\/api\/progress\/intent/);
  assert.match(api, /writeSupervisedIntent/);
  assert.match(lib, /FR-3/);
  assert.match(lib, /FR-2/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(childrenPage, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(ui + lib + api, /family-v1-home|children-database|bc-4765f2f0|\/api\/intent|learning_intents/);
  assert.doesNotMatch(ui + lib, /Gym|Foundry|Retainer|\$150|\$250|\$500/);
  assert.match(family, /Now \/ Confidence \/ Next/);
  assert.deepEqual(
    Object.keys(pkg.dependencies).filter((name) => name === "remotion" || name.startsWith("@remotion/")).sort(),
    ["@remotion/player", "remotion"],
  );
});

test("master and priors untouched after parent-owned intent", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Parent-owned intent after PR 194; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  assert.match(wave5, /## Parent-owned intent \(PASS\)/);
  assert.match(wave5, /PR 194 merge `3322e52`/);
  assert.match(wave5, /\/intent/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Parent-owned intent \*\*PASS\*\*/);
  assert.match(campus, /PR 194 merge `3322e52`/);
  assert.match(campus, /Parent-supervised progress \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Parent-owned intent **PASS**. PR 194 merge `3322e52`.").length - 1,
    3,
  );
  assert.equal(
    campus.split("Parent-supervised progress **PASS**. PR 193 merge `ae8347d`.").length - 1,
    3,
  );
  assert.match(rail, /\/intent/);
  assert.match(rail, /Parent-owned intent/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Parent-owned intent FR-3/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
});
