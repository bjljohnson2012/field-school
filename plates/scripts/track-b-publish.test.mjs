import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {FOUR_PLATES, auditQualityPath, planQualityPath} from "./track-b-quality-path.mjs";
import {runTrackBPublish} from "./track-b-publish.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const words = JSON.parse(readFileSync(join(root, "fixtures", "track-b-words.json"), "utf8"));
const audio = join(root, "fixtures", "track-b-fixture.wav");
const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

test("publish evidence stays off the public distribute path", () => {
  const result = runTrackBPublish({capId: "fixture-audio", audio, words, dest});
  assert.equal(result.verdict, "PASS");
  assert.equal(result.publish, "PASS");
  assert.equal(result.distribute, false);
  assert.equal(result.public, false);
  assert.equal(result.dest_flipped, false);
  assert.equal(result.written, false);
  assert.equal(result.rendering, "idle");
  assert.equal(result.gpu, false);
  assert.equal(result.cleaning, "PASS");
  assert.equal(result.antagonist, "PASS");
  assert.equal(result.compositionId, "TrackBMaster");
  assert.equal(result.durationInFrames, 1050);
  assert.deepEqual(result.plateOrder, FOUR_PLATES);
  assert.equal(existsSync(dest), false);

  const blocked = runTrackBPublish({distribute: true});
  assert.equal(blocked.verdict, "HARD_FAIL");
  assert.equal(blocked.publish, "HELD");
  assert.equal(blocked.distribute, false);
  assert.equal(blocked.public, false);

  const dirty = runTrackBPublish({capId: "27pn9xs0zk8a73g", audio, words, dest});
  assert.equal(dirty.verdict, "HARD_FAIL");
  assert.equal(dirty.publish, "HELD");
  assert.equal(dirty.distribute, false);
  assert.equal(dirty.dest_flipped, false);

  const plan = planQualityPath({
    capId: "fixture-audio",
    audio,
    words,
    plates: FOUR_PLATES,
    dest,
    target: "plates",
  });
  assert.equal(auditQualityPath(plan).verdict, "PASS");
  const pkg = JSON.parse(readFileSync(join(root, "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
});

test("the publish script prints distribute false and does not write the master", () => {
  const run = spawnSync(process.execPath, [join(here, "track-b-publish.mjs")], {encoding: "utf8"});
  assert.equal(run.status, 0);
  const body = JSON.parse(run.stdout);
  assert.equal(body.publish, "PASS");
  assert.equal(body.distribute, false);
  assert.equal(body.public, false);
  assert.equal(existsSync(body.dest), false);
  const refused = spawnSync(process.execPath, [join(here, "track-b-publish.mjs"), "--distribute"], {encoding: "utf8"});
  assert.equal(refused.status, 1);
  const held = JSON.parse(refused.stdout);
  assert.equal(held.distribute, false);
  assert.equal(held.public, false);
  assert.equal(held.publish, "HELD");
});
