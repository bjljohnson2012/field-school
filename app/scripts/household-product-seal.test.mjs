import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { selectSupervisedChild } from "../src/lib/progress/supervised.ts";
import { writeSupervisedIntent } from "../src/lib/progress/supervised-intent.ts";
import { assembleSupervisedPath, selectSupervisedPath } from "../src/lib/progress/supervised-path.ts";
import { writeSupervisedPortion, selectSupervisedPortion } from "../src/lib/progress/supervised-portion.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const MASTER_SHA = "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
const SOURCE = "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("wait-fill: path assembly and next portion run in one parent session", () => {
  const dir = mkdtempSync(join(tmpdir(), "household-product-seal-"));
  process.env.SUPERVISED_INTENT_PATH = join(dir, "intent.json");
  process.env.SUPERVISED_PATH_PATH = join(dir, "path.json");
  process.env.SUPERVISED_PORTION_PATH = join(dir, "portion.json");
  process.env.SUPERVISED_PROGRESS_PATH = join(dir, "progress.json");

  const progress = selectSupervisedChild("play-child");
  assert.equal(progress.selected?.id, "play-child");
  assert.equal(progress.selected?.kind, "child");
  assert.equal(progress.selected?.login, "none");
  assert.equal(progress.selected?.user, false);

  const intent = writeSupervisedIntent("play-child", {
    goals: ["Keep the next station moving when the parent leaves"],
    subjects: ["LessonSpine"],
    themes: ["parent-owned plan"],
    timeHorizon: "this hire",
    constraints: ["Child is not a User", "No child login"],
  });
  assert.equal(intent.ok, true);
  assert.equal(intent.selected?.kind, "child");
  assert.equal(intent.selected?.login, "none");
  assert.equal(intent.selected?.user, false);

  const path = assembleSupervisedPath("play-child", {
    ...intent.selected,
    name: intent.selected.name,
  });
  assert.equal(path.ok, true);
  assert.equal(path.selected?.kind, "child");
  assert.equal(path.selected?.user, false);
  assert.ok((path.selected?.items || []).length > 0);
  assert.match(path.selected?.items[0]?.title || "", /LessonSpine|parent|hire/i);
  assert.equal(selectSupervisedPath("play-child").fr[0], "FR-4");

  const locked = writeSupervisedPortion("play-child", "lock", {
    name: "Play Child",
    horizon: intent.selected.timeHorizon,
    pathItems: path.selected.items,
  });
  assert.equal(locked.ok, true);
  assert.equal(locked.selected?.status, "locked");
  assert.equal(locked.selected?.kind, "child");
  assert.equal(locked.selected?.login, "none");
  assert.equal(locked.selected?.user, false);
  assert.equal(selectSupervisedPortion("play-child").fr[0], "FR-5");

  const overridden = writeSupervisedPortion("play-child", "override", {
    name: "Play Child",
    horizon: intent.selected.timeHorizon,
    items: ["QuizBumper next-up"],
  });
  assert.equal(overridden.ok, true);
  assert.equal(overridden.selected?.status, "overridden");
  assert.equal(overridden.selected?.user, false);
  assert.equal(overridden.selected?.items[0]?.title, "QuizBumper next-up");

  const unknownPath = assembleSupervisedPath("not-a-child", intent.selected);
  assert.equal(unknownPath.ok, false);
  const unknownPortion = writeSupervisedPortion("not-a-child", "lock", {
    pathItems: path.selected.items,
  });
  assert.equal(unknownPortion.ok, false);

  delete process.env.SUPERVISED_INTENT_PATH;
  delete process.env.SUPERVISED_PATH_PATH;
  delete process.env.SUPERVISED_PORTION_PATH;
  delete process.env.SUPERVISED_PROGRESS_PATH;
  rmSync(dir, { recursive: true, force: true });
});

test("household product seal does not steal family LIVE", () => {
  const pathLib = read("src/lib/progress/supervised-path.ts");
  const portionLib = read("src/lib/progress/supervised-portion.ts");
  const pathApi = read("src/app/api/progress/path/route.ts");
  const portionApi = read("src/app/api/progress/portion/route.ts");
  const family = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(pathLib, /FR-4/);
  assert.match(portionLib, /FR-5/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(pathLib + portionLib + pathApi + portionApi, /family-v1-home|children-database|bc-4765f2f0/);
  assert.doesNotMatch(pathApi + portionApi, /from ["']@\/lib\/curriculum|from ["']@\/lib\/intent/);
  assert.match(family, /Now \/ Confidence \/ Next/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
});

test("master dest untouched after household product seal", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  const gate = readFileSync(join(repo, "docs/prelaunch/LAUNCH_GATE.md"), "utf8");
  assert.match(gate, /Product \| HELD/);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
});
