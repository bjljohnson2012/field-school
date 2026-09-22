import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {FOUR_PLATES, auditQualityPath, mapTrackBCaptions, planQualityPath} from "./track-b-quality-path.mjs";
import {buildExportManifest, exportReadyChecklist} from "./track-b-export-ready.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const words = JSON.parse(readFileSync(join(root, "fixtures", "track-b-words.json"), "utf8"));
const audio = join(root, "fixtures", "track-b-fixture.wav");
const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

test("the fixture dry-run proves the master is export-ready", () => {
  const manifest = buildExportManifest({capId: "fixture-audio", audio, words, dest});
  assert.equal(manifest.ok, true);
  assert.equal(manifest.ready, true);
  assert.equal(manifest.dryRun, true);
  assert.equal(manifest.gpu, false);
  assert.equal(manifest.renders, false);
  assert.equal(manifest.written, false);
  assert.equal(manifest.compositionId, "TrackBMaster");
  assert.equal(manifest.durationInFrames, 1050);
  assert.equal(manifest.durationSec, 35);
  assert.equal(manifest.fps, 30);
  assert.equal(manifest.width, 1920);
  assert.equal(manifest.height, 1080);
  assert.deepEqual(manifest.plateOrder, ["Opener", "TalkingHead", "RecapCard", "QuizBumper"]);
  assert.deepEqual(manifest.plateOrder, FOUR_PLATES);
  assert.deepEqual(
    manifest.plates.map((plate) => [plate.name, plate.from, plate.frames]),
    [
      ["Opener", 0, 300],
      ["TalkingHead", 300, 240],
      ["RecapCard", 540, 300],
      ["QuizBumper", 840, 210],
    ],
  );
  assert.equal(manifest.captionCount, mapTrackBCaptions(words).length);
  assert.equal(manifest.antagonist, "PASS");
  assert.equal(existsSync(dest), false);
  const checklist = exportReadyChecklist(manifest);
  assert.equal(checklist.verdict, "PASS");
  assert.equal(checklist.checks.manifest, true);
  assert.equal(checklist.checks.duration, true);
  assert.equal(checklist.checks.plateOrder, true);
  assert.equal(checklist.rendering, "idle");
  const plan = planQualityPath({
    capId: "fixture-audio",
    audio,
    words,
    plates: FOUR_PLATES,
    dest,
    target: "plates",
  });
  assert.equal(auditQualityPath(plan).verdict, "PASS");
  assert.deepEqual(
    buildExportManifest({render: true}),
    {ok: false, error: "dry_run_only"},
  );
  assert.equal(buildExportManifest({capId: "27pn9xs0zk8a73g", audio, words, dest}).ok, false);
  const pkg = JSON.parse(readFileSync(join(root, "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
});

test("the dry-run script prints the checklist and does not write the master", () => {
  const run = spawnSync(process.execPath, [join(here, "track-b-export-ready.mjs")], {encoding: "utf8"});
  assert.equal(run.status, 0);
  const printed = JSON.parse(run.stdout);
  assert.equal(printed.checklist.verdict, "PASS");
  assert.deepEqual(printed.manifest.plateOrder, FOUR_PLATES);
  assert.equal(printed.manifest.durationInFrames, 1050);
  assert.equal(existsSync(printed.manifest.dest), false);
  const refused = spawnSync(process.execPath, [join(here, "track-b-export-ready.mjs"), "--render"], {encoding: "utf8"});
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /dry_run_only/);
});
