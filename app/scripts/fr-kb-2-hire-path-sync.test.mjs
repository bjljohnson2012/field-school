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

test("Hire-path intent/path/portion persist on the selected Child brain", () => {
  const dest = join(mkdtempSync(join(tmpdir(), "supervised-brain-sync-")), "supervised-brain.json");
  process.env.SUPERVISED_BRAIN_PATH = dest;
  const started = writeSupervisedBrain("play-child", "start", {
    name: "Play Child",
    title: "Play Child knowledge brain",
    intent: { goals: ["Hold LessonSpine from parent intent"], timeHorizon: "this hire" },
    pathItems: [{ title: "LessonSpine Ready / HLS" }],
    portion: { horizon: "this hire", items: [{ title: "LessonSpine Ready / HLS" }] },
  });
  assert.equal(started.ok, true);
  assert.equal(started.selected?.status, "started");
  assert.equal(started.evidence.fr[0], "FR-KB-1");
  assert.equal(started.evidence.fr[1], "FR-KB-2");
  assert.equal(started.evidence.distribute, false);
  assert.equal(started.evidence.launch, "CLOSED 0/8");
  const reflected = selectSupervisedBrain("play-child", {
    intent: {
      goals: ["Keep private curriculum on this brain"],
      subjects: ["LessonSpine"],
      timeHorizon: "this hire",
      name: "Play Child",
    },
    pathItems: [{ title: "QuizBumper next-up", play: "/play/lesson-spine" }],
    portion: { horizon: "this hire", items: [{ title: "QuizBumper next-up" }] },
  });
  assert.equal(reflected.selected?.status, "started");
  assert.equal(reflected.selected?.intent.goals[0], "Keep private curriculum on this brain");
  assert.equal(reflected.selected?.paths.items[0]?.title, "QuizBumper next-up");
  assert.equal(reflected.selected?.portion.items[0]?.title, "QuizBumper next-up");
  const synced = writeSupervisedBrain("play-child", "sync", {
    name: "Play Child",
    intent: { goals: ["Keep private curriculum on this brain"], timeHorizon: "this hire" },
    pathItems: [{ title: "QuizBumper next-up", play: "/play/lesson-spine" }],
    portion: { horizon: "this hire", items: [{ title: "QuizBumper next-up" }] },
    progress: {
      now: { title: "LessonSpine Ready / HLS", copy: "Play Child is on the locked LessonSpine rail." },
      confidence: { state: "getting_there", label: "Getting there" },
      next: { title: "QuizBumper next-up", copy: "Next is the next-up beat." },
    },
  });
  assert.equal(synced.ok, true);
  assert.equal(synced.selected?.status, "updated");
  assert.equal(synced.selected?.user, false);
  assert.equal(synced.selected?.login, "none");
  assert.equal(synced.selected?.kind, "child");
  assert.equal(synced.selected?.intent.goals[0], "Keep private curriculum on this brain");
  assert.equal(synced.selected?.paths.items[0]?.title, "QuizBumper next-up");
  assert.equal(synced.selected?.portion.items[0]?.title, "QuizBumper next-up");
  assert.equal(synced.selected?.progress.confidence.label, "Getting there");
  const unknown = writeSupervisedBrain("not-a-child", "sync", {
    pathItems: [{ title: "no" }],
  });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.error, "unknown_child");
  delete process.env.SUPERVISED_BRAIN_PATH;
  rmSync(dirname(dest), { recursive: true, force: true });
});

test("FR-KB-2 hire-path sync does not steal family LIVE or family brain sync", () => {
  const page = read("src/app/brain/page.tsx");
  const ui = read("src/components/fr-kb-1-parent-brain.tsx");
  const api = read("src/app/api/progress/brain/route.ts");
  const lib = read("src/lib/progress/supervised-brain.ts");
  const sync = read("src/lib/progress/hire-path-brain-sync.ts");
  const intentApi = read("src/app/api/progress/intent/route.ts");
  const pathApi = read("src/app/api/progress/path/route.ts");
  const portionApi = read("src/app/api/progress/portion/route.ts");
  const family = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const childrenPage = read("src/app/children/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(page, /FrKb1ParentBrain/);
  assert.match(ui, /data-brain="fr-kb-1"/);
  assert.match(ui, /data-hire-path-sync="fr-kb-2"/);
  assert.match(ui, /data-brain-sync/);
  assert.match(ui, /Sync from hire path/);
  assert.match(api, /export async function PUT/);
  assert.match(api, /hirePathBrainHint/);
  assert.match(lib, /FR-KB-1/);
  assert.match(lib, /FR-KB-2/);
  assert.match(lib, /"sync"/);
  assert.match(sync, /syncHirePathBrain/);
  assert.match(intentApi, /syncHirePathBrain/);
  assert.match(pathApi, /syncHirePathBrain/);
  assert.match(portionApi, /syncHirePathBrain/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(childrenPage, /knowledge brain/i);
  assert.doesNotMatch(
    ui + lib + api + sync,
    /family-v1-home|children-database|bc-4765f2f0|\/api\/curriculum|curriculum_paths|learning_intents|next_portions|next_portion_items|knowledge_brains|growth_units/,
  );
  assert.doesNotMatch(ui + lib + api + sync, /\/api\/brain\/sync/);
  assert.doesNotMatch(api + sync, /from ["']@\/lib\/brain/);
  assert.doesNotMatch(api + sync, /from ["']@\/lib\/portion/);
  assert.doesNotMatch(ui + lib + sync, /Gym|Foundry|Retainer|\$150|\$250|\$500/);
  assert.match(family, /Now \/ Confidence \/ Next/);
  assert.deepEqual(
    Object.keys(pkg.dependencies).filter((name) => name === "remotion" || name.startsWith("@remotion/")).sort(),
    ["@remotion/player", "remotion"],
  );
});

test("master and priors untouched after hire-path sync", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Hire-path sync after PR 198 merge; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  assert.match(wave5, /## Hire-path sync \(PASS\)/);
  assert.match(wave5, /PR 198 merge `95b966c`/);
  assert.match(wave5, /\/brain/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Hire-path sync \*\*PASS\*\*/);
  assert.match(campus, /PR 198 merge `95b966c`/);
  assert.match(campus, /Knowledge brain \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Hire-path sync **PASS**. PR 198 merge `95b966c`.").length - 1,
    3,
  );
  assert.equal(
    campus.split("Knowledge brain **PASS**. PR 197 merge `e09f2d1`.").length - 1,
    3,
  );
  assert.match(rail, /Hire-path sync/);
  assert.match(rail, /\/api\/progress\/brain/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Hire-path sync FR-KB-2/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
});
