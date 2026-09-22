import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {auditQualityPath, FOUR_PLATES, mapTrackBCaptions, masterTimeline, planQualityPath} from "./track-b-quality-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const words = JSON.parse(readFileSync(join(root, "fixtures", "track-b-words.json"), "utf8"));
const audio = join(root, "fixtures", "track-b-fixture.wav");
const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

test("the master timeline wires the four captioned plates", () => {
  const captions = mapTrackBCaptions(words);
  const timeline = masterTimeline(words);
  assert.equal(timeline.id, "TrackBMaster");
  assert.equal(timeline.fps, 30);
  assert.equal(timeline.width, 1920);
  assert.equal(timeline.height, 1080);
  assert.equal(timeline.renders, false);
  assert.equal(timeline.durationInFrames, 1050);
  assert.deepEqual(
    timeline.plates.map((plate) => plate.name),
    ["Opener", "TalkingHead", "RecapCard", "QuizBumper"],
  );
  assert.deepEqual(timeline.plates.map((plate) => plate.name), FOUR_PLATES);
  assert.deepEqual(
    timeline.plates.map((plate) => [plate.component, plate.from, plate.frames, plate.durationSec]),
    [
      ["Opener", 0, 300, 10],
      ["TalkingHeadCard", 300, 240, 8],
      ["RecapCard", 540, 300, 10],
      ["QuizBumper", 840, 210, 7],
    ],
  );
  for (const plate of timeline.plates) {
    assert.deepEqual(plate.captions, captions);
  }
  assert.equal(timeline.plates.some((plate) => plate.name === "DefinitionBoard"), false);

  const master = readFileSync(join(root, "src", "TrackBMaster.tsx"), "utf8");
  const order = ["Opener", "TalkingHead", "RecapCard", "QuizBumper"];
  let cursor = 0;
  for (const name of order) {
    const at = master.indexOf(`name="${name}"`);
    assert.equal(at > cursor, true);
    cursor = at;
  }
  assert.equal(master.includes("DefinitionBoard"), false);
  assert.equal((master.match(/captions=\{TRACK_B_CAPTIONS\}/g) || []).length, 4);
  assert.match(master, /from=\{0\} durationInFrames=\{300\} name="Opener"/);
  assert.match(master, /from=\{300\} durationInFrames=\{240\} name="TalkingHead"/);
  assert.match(master, /from=\{540\} durationInFrames=\{300\} name="RecapCard"/);
  assert.match(master, /from=\{840\} durationInFrames=\{210\} name="QuizBumper"/);

  const rootTsx = readFileSync(join(root, "src", "Root.tsx"), "utf8");
  const chunk = rootTsx.split('id="TrackBMaster"')[1].split("/>")[0];
  assert.match(chunk, /component=\{TrackBMaster\}/);
  assert.match(chunk, /durationInFrames=\{1050\}/);
  assert.match(chunk, /fps=\{30\}/);
  assert.match(chunk, /width=\{1920\}/);
  assert.match(chunk, /height=\{1080\}/);

  const plan = planQualityPath({
    capId: "fixture-audio",
    audio,
    words,
    plates: FOUR_PLATES,
    dest,
    target: "plates",
  });
  assert.equal(plan.ok, true);
  assert.equal(plan.renders, false);
  assert.deepEqual(plan.timeline, timeline);
  const audit = auditQualityPath(plan);
  assert.equal(audit.verdict, "PASS");
  assert.equal(audit.hold_cleaning, true);
  assert.equal(audit.rendering, "idle");
  assert.equal(existsSync(dest), false);
  const pkg = JSON.parse(readFileSync(join(root, "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
});
