import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {FOUR_PLATES, auditQualityPath, planQualityPath} from "./track-b-quality-path.mjs";
import {runTrackBCleaning} from "./track-b-cleaning.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const words = JSON.parse(readFileSync(join(root, "fixtures", "track-b-words.json"), "utf8"));
const audio = join(root, "fixtures", "track-b-fixture.wav");
const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

test("cleaning auto-flips only when the fixture export checklist passes", () => {
  const result = runTrackBCleaning({capId: "fixture-audio", audio, words, dest});
  assert.equal(result.verdict, "PASS");
  assert.equal(result.auto_flip, true);
  assert.equal(result.hold_cleaning, false);
  assert.equal(result.dest_flipped, false);
  assert.equal(result.distribute, "HELD");
  assert.equal(result.publish, "HELD");
  assert.equal(result.rendering, "idle");
  assert.equal(result.gpu, false);
  assert.equal(result.compositionId, "TrackBMaster");
  assert.equal(result.durationInFrames, 1050);
  assert.deepEqual(result.plateOrder, FOUR_PLATES);
  assert.equal(result.antagonist, "PASS");
  assert.equal(result.checklist, "PASS");
  assert.equal(existsSync(dest), false);

  for (const input of [
    {render: true},
    {gpu: true},
    {capId: "27pn9xs0zk8a73g", audio, words, dest},
    {capId: "fixture-audio", audio, words, dest: "/workspace/app/public/master.mp4", target: "next"},
    {capId: "fixture-audio", audio, words, plates: [...FOUR_PLATES, "DefinitionBoard"], dest},
  ]) {
    const failed = runTrackBCleaning(input);
    assert.equal(failed.verdict, "HARD_FAIL");
    assert.equal(failed.auto_flip, false);
    assert.equal(failed.hold_cleaning, true);
    assert.equal(failed.dest_flipped, false);
  }

  const plan = planQualityPath({
    capId: "fixture-audio",
    audio,
    words,
    plates: FOUR_PLATES,
    dest,
    target: "plates",
  });
  assert.equal(auditQualityPath(plan).verdict, "PASS");
  assert.equal(auditQualityPath(plan).hold_cleaning, true);
  const pkg = JSON.parse(readFileSync(join(root, "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
});

test("the cleaning script prints PASS evidence and does not write the master", () => {
  const run = spawnSync(process.execPath, [join(here, "track-b-cleaning.mjs")], {encoding: "utf8"});
  assert.equal(run.status, 0);
  const body = JSON.parse(run.stdout);
  assert.equal(body.verdict, "PASS");
  assert.equal(body.auto_flip, true);
  assert.equal(body.hold_cleaning, false);
  assert.equal(body.dest_flipped, false);
  assert.equal(existsSync(body.dest), false);
  const refused = spawnSync(process.execPath, [join(here, "track-b-cleaning.mjs"), "--flip-dest"], {encoding: "utf8"});
  assert.equal(refused.status, 1);
  const held = JSON.parse(refused.stdout);
  assert.equal(held.auto_flip, false);
  assert.equal(held.hold_cleaning, true);
  assert.equal(held.dest_flipped, false);
});
