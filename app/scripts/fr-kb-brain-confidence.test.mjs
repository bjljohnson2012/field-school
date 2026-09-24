import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  selectSupervisedBrain,
  writeSupervisedBrain,
} from "../src/lib/progress/supervised-brain.ts";

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

function writeConfidence(childId, name, state, sourceBody, noteBody) {
  const started = writeSupervisedBrain(childId, "start", {
    name,
    title: `${name} knowledge brain`,
    sources: [sourceBody],
    notes: [noteBody],
  });
  assert.equal(started.ok, true);
  const written = writeSupervisedBrain(childId, "confidence", {
    name,
    confidence: state,
  });
  assert.equal(written.ok, true);
  assert.equal(written.selected?.kind, "child");
  assert.equal(written.selected?.login, "none");
  assert.equal(written.selected?.user, false);
  assert.equal(written.selected?.progress.confidence.state, state);
  assert.equal(written.selected?.progress.confidence.owned, "parent");
  assert.ok((written.selected?.sources || []).length >= 1);
  assert.ok((written.selected?.notes || []).length >= 1);
  const selected = selectSupervisedBrain(childId, {
    progress: {
      confidence: { state: "not_yet", label: "Not yet" },
    },
  });
  assert.equal(selected.selected?.id, childId);
  assert.equal(selected.selected?.kind, "child");
  assert.equal(selected.selected?.login, "none");
  assert.equal(selected.selected?.user, false);
  assert.equal(selected.selected?.progress.confidence.state, state);
  assert.equal(selected.selected?.progress.confidence.owned, "parent");
  assert.ok((selected.selected?.sources || []).length >= 1);
  assert.ok((selected.selected?.notes || []).length >= 1);
  assert.deepEqual([...selected.fr], ["FR-KB-1", "FR-KB-2"]);
  assert.equal(selected.fr.includes("FR-KB-3"), false);
  assert.equal(selected.distribute, false);
  assert.equal(selected.launch, "CLOSED 0/8");
  return selected;
}

test("Parent sets FR-6 confidence under the tracked Child on the brain", () => {
  const dest = join(mkdtempSync(join(tmpdir(), "supervised-brain-confidence-")), "supervised-brain.json");
  process.env.SUPERVISED_BRAIN_PATH = dest;
  writeConfidence(
    "play-child",
    "Child",
    "ready",
    "LessonSpine Ready / HLS private source",
    "Child parent note on private curriculum",
  );
  const salesperson = writeSupervisedBrain("hire-child", "confidence", {
    confidence: "getting_there",
  });
  assert.equal(salesperson.ok, false);
  assert.equal(salesperson.error, "unknown_child");
  const unknown = writeSupervisedBrain("not-a-child", "confidence", {
    confidence: "ready",
  });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.error, "unknown_child");
  delete process.env.SUPERVISED_BRAIN_PATH;
  rmSync(dirname(dest), { recursive: true, force: true });
});

test("FR-KB brain confidence does not steal family LIVE or family brain store", () => {
  const page = read("src/app/brain/page.tsx");
  const ui = read("src/components/fr-kb-1-parent-brain.tsx");
  const api = read("src/app/api/progress/brain/route.ts");
  const lib = read("src/lib/progress/supervised-brain.ts");
  const family = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const childrenPage = read("src/app/children/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(page, /FrKb1ParentBrain/);
  assert.match(ui, /data-brain="fr-kb-1"/);
  assert.match(ui, /data-hire-path-sync="fr-kb-2"/);
  assert.match(ui, /data-brain-sources-notes/);
  assert.match(ui, /data-brain-confidence="fr-6"/);
  assert.match(ui, /data-confidence-state/);
  assert.match(api, /body.confidence/);
  assert.match(lib, /FR-KB-1/);
  assert.match(lib, /FR-KB-2/);
  assert.match(lib, /"confidence"/);
  assert.doesNotMatch(lib, /FR-KB-3/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(childrenPage, /knowledge brain/i);
  assert.doesNotMatch(
    ui + lib + api,
    /family-v1-home|children-database|bc-4765f2f0|\/api\/curriculum|curriculum_paths|\/api\/intent|learning_intents|next_portions|next_portion_items|\/api\/brain|knowledge_brains|growth_units|\/api\/portion/,
  );
  assert.doesNotMatch(api, /from ["']@\/lib\/brain/);
  assert.doesNotMatch(ui + lib, /Gym|Foundry|Retainer|\$150|\$250|\$500/);
  assert.match(family, /Now \/ Confidence \/ Next/);
  assert.deepEqual(
    Object.keys(pkg.dependencies).filter((name) => name === "remotion" || name.startsWith("@remotion/")).sort(),
    ["@remotion/player", "remotion"],
  );
});

test("master and priors untouched after brain confidence", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Brain confidence after PR 202 merge; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  assert.match(wave5, /## Brain confidence \(PASS\)/);
  assert.match(wave5, /PR 202 merge `ce32eef`/);
  assert.match(wave5, /\/brain/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Brain confidence \*\*PASS\*\*/);
  assert.match(campus, /PR 202 merge `ce32eef`/);
  assert.match(campus, /Sources and notes \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Brain confidence **PASS**. PR 202 merge `ce32eef`.").length - 1,
    3,
  );
  assert.equal(
    campus.split("Sources and notes **PASS**. PR 199 merge `0a10678`.").length - 1,
    3,
  );
  assert.match(rail, /Brain confidence/);
  assert.match(rail, /\/api\/progress\/brain/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Brain confidence FR-6 \/ FR-KB/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
});
