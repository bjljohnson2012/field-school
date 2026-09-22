import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {FOUR_PLATES, auditQualityPath, mapTrackBCaptions, planQualityPath} from "./track-b-quality-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const audio = join(here, "..", "fixtures", "track-b-fixture.wav");
const words = JSON.parse(readFileSync(join(here, "..", "fixtures", "track-b-words.json"), "utf8"));
const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

test("fixture audio maps WhisperX words to captions on the Track B path", () => {
  const captions = mapTrackBCaptions(words);
  assert.deepEqual(captions, [
    {text: " Keep", startMs: 120, endMs: 480, timestampMs: null, confidence: null},
    {text: " moving", startMs: 500, endMs: 920, timestampMs: null, confidence: null},
    {text: " today.", startMs: 1020, endMs: 1400, timestampMs: null, confidence: null},
  ]);
  const plan = planQualityPath({
    capId: "fixture-audio",
    audio,
    words,
    plates: FOUR_PLATES,
    dest,
    target: "plates",
  });
  assert.equal(plan.ok, true);
  assert.equal(plan.audio, audio);
  assert.deepEqual(plan.captions, captions);
  assert.equal(plan.renders, false);
  assert.equal(plan.captions.some((caption) => "speaker" in caption || "score" in caption), false);
  const audit = auditQualityPath(plan);
  assert.equal(audit.verdict, "PASS");
  assert.equal(audit.hold_cleaning, true);
  assert.equal(audit.rendering, "idle");
  assert.equal(audit.gates["VOX-H08"], "PASS");
  assert.equal(audit.gates["VOX-H06"], "PASS");
  assert.equal(audit.gates["VOX-H10"], "PASS");
});

test("a locked take, a Next dest, and a broken caption clock fail", () => {
  assert.equal(
    planQualityPath({
      capId: "fixture-audio",
      audio: "/opt/fieldschool-video/hls/27pn9xs0zk8a73g/take.wav",
      words,
      plates: FOUR_PLATES,
      dest,
    }).error,
    "locked_dest",
  );
  assert.equal(
    planQualityPath({
      capId: "fixture-audio",
      audio,
      words,
      plates: FOUR_PLATES,
      dest: "/workspace/app/public/master.mp4",
      target: "next",
    }).error,
    "remotion_stays_in_plates",
  );
  const broken = auditQualityPath({
    capId: "fixture-audio",
    dest,
    plates: FOUR_PLATES,
    width: 1920,
    height: 1080,
    fps: 30,
    target: "plates",
    renders: false,
    captions: [{text: "Keep", startMs: 200, endMs: 100, timestampMs: 0, confidence: 1, speaker: "SPEAKER_00"}],
  });
  assert.equal(broken.verdict, "HARD_FAIL");
  assert.equal(broken.gates["VOX-H08"], "HARD_FAIL");
  assert.equal(broken.hold_cleaning, true);
  const pkg = JSON.parse(readFileSync(join(here, "..", "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
});
