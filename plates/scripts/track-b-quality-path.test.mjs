import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {LOCKED_JUST_ID} from "./render-lock.mjs";
import {FOUR_PLATES, auditQualityPath, planQualityPath} from "./track-b-quality-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const words = {
  segments: [
    {
      words: [
        {word: "Keep", start: 0.12, end: 0.48},
        {word: "moving", start: 0.5, end: 0.92},
        {word: "today.", start: 1.02, end: 1.4},
      ],
    },
  ],
};

const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

test("a fixture take plans WhisperX words, four plates, and master.mp4", () => {
  const plan = planQualityPath({
    capId: "fixture-take",
    words,
    plates: FOUR_PLATES,
    dest,
    target: "plates",
  });
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.stages, ["cap", "whisperx", "plates", "master"]);
  assert.deepEqual(plan.plates, ["Opener", "TalkingHead", "RecapCard", "QuizBumper"]);
  assert.equal(plan.captions.length, 3);
  assert.equal(plan.captions[0].text, " Keep");
  assert.equal(plan.captions[0].startMs, 120);
  assert.equal(plan.captions[1].text, " moving");
  assert.equal(plan.dest, dest);
  assert.equal(plan.renders, false);
  assert.equal(plan.target, "plates");
  assert.equal(plan.justId, "27pn9xs0zk8a73g");
  const audit = auditQualityPath(plan);
  assert.equal(audit.verdict, "PASS");
  assert.equal(audit.hold_cleaning, true);
  assert.equal(audit.escalate, false);
  assert.equal(audit.rendering, "idle");
  assert.equal(audit.gates["VOX-H01"], "PASS");
  assert.equal(audit.gates["VOX-H05"], "PASS");
  assert.equal(audit.gates["VOX-H06"], "PASS");
  assert.equal(audit.gates["VOX-H08"], "PASS");
  assert.equal(audit.gates["VOX-H10"], "PASS");
});

test("Just, the Next app, a fifth plate, and empty words fail the bar", () => {
  assert.equal(LOCKED_JUST_ID, "27pn9xs0zk8a73g");
  assert.deepEqual(
    planQualityPath({
      capId: "27pn9xs0zk8a73g",
      words,
      plates: FOUR_PLATES,
      dest,
    }),
    {ok: false, error: "locked_dest"},
  );
  assert.deepEqual(
    planQualityPath({
      capId: "fixture-take",
      words,
      plates: FOUR_PLATES,
      dest: "/opt/fieldschool-video/hls/27pn9xs0zk8a73g/master.mp4",
    }),
    {ok: false, error: "locked_dest"},
  );
  assert.deepEqual(
    planQualityPath({
      capId: "fixture-take",
      words,
      plates: FOUR_PLATES,
      dest: "/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4",
    }),
    {ok: false, error: "locked_dest"},
  );
  assert.deepEqual(
    planQualityPath({
      capId: "fixture-take",
      words,
      plates: FOUR_PLATES,
      dest: "/workspace/app/public/master.mp4",
      target: "next",
    }),
    {ok: false, error: "remotion_stays_in_plates"},
  );
  assert.deepEqual(
    planQualityPath({
      capId: "fixture-take",
      words,
      plates: [...FOUR_PLATES, "DefinitionBoard"],
      dest,
    }),
    {ok: false, error: "four_plates"},
  );
  assert.deepEqual(
    planQualityPath({
      capId: "fixture-take",
      words: {segments: []},
      plates: FOUR_PLATES,
      dest,
    }),
    {ok: false, error: "whisperx_words"},
  );
  const broken = auditQualityPath({
    capId: "27pn9xs0zk8a73g",
    dest: "/opt/fieldschool-video/hls/27pn9xs0zk8a73g/master.mp4",
    plates: ["Opener"],
    captions: [],
    width: 1080,
    height: 1920,
    fps: 30,
    target: "next",
    renders: true,
  });
  assert.equal(broken.verdict, "HARD_FAIL");
  assert.equal(broken.hold_cleaning, true);
  assert.equal(broken.escalate, true);
  assert.equal(broken.rendering, "idle");
  assert.equal(broken.gates["VOX-H01"], "HARD_FAIL");
  assert.equal(broken.gates["VOX-H05"], "HARD_FAIL");
  assert.equal(broken.gates["VOX-H06"], "HARD_FAIL");
  assert.equal(broken.gates["VOX-H08"], "HARD_FAIL");
  assert.equal(broken.gates["VOX-H10"], "HARD_FAIL");
});

test("Remotion stays out of the Next app", () => {
  const pkg = JSON.parse(readFileSync(join(here, "..", "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
  const plates = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
  assert.equal(plates.dependencies.remotion, "4.0.526");
  assert.equal(plates.dependencies["@remotion/captions"], "4.0.526");
});
