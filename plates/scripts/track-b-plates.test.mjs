import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {auditQualityPath, fourPlateCaptions, mapTrackBCaptions, planQualityPath, FOUR_PLATES} from "./track-b-quality-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const words = JSON.parse(readFileSync(join(root, "fixtures", "track-b-words.json"), "utf8"));
const audio = join(root, "fixtures", "track-b-fixture.wav");
const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

test("the four plates consume the fixture caption clock", () => {
  const captions = mapTrackBCaptions(words);
  const plates = fourPlateCaptions(words);
  assert.deepEqual(Object.keys(plates), ["Opener", "TalkingHead", "RecapCard", "QuizBumper"]);
  for (const name of FOUR_PLATES) {
    assert.deepEqual(plates[name], captions);
  }
  const clock = readFileSync(join(root, "src", "trackBCaptions.ts"), "utf8");
  for (const caption of captions) {
    assert.match(clock, new RegExp(`text: "${caption.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(clock, new RegExp(`startMs: ${caption.startMs}`));
    assert.match(clock, new RegExp(`endMs: ${caption.endMs}`));
  }
  const rootTsx = readFileSync(join(root, "src", "Root.tsx"), "utf8");
  for (const id of ["Opener", "RecapCard", "QuizBumper", "TalkingHeadCard"]) {
    const chunk = rootTsx.split(`id="${id}"`)[1].split("calculateMetadata")[0];
    assert.match(chunk, /captions: TRACK_B_CAPTIONS/);
  }
  const definition = rootTsx.split('id="DefinitionBoard"')[1].split("calculateMetadata")[0];
  assert.equal(definition.includes("TRACK_B_CAPTIONS"), false);
  for (const file of ["Opener.tsx", "RecapCard.tsx", "QuizBumper.tsx", "TalkingHeadCard.tsx"]) {
    assert.match(readFileSync(join(root, "src", file), "utf8"), /<Karaoke captions=\{captions\} \/>/);
  }
  const plan = planQualityPath({
    capId: "fixture-audio",
    audio,
    words,
    plates: FOUR_PLATES,
    dest,
    target: "plates",
  });
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.captions, captions);
  const audit = auditQualityPath(plan);
  assert.equal(audit.verdict, "PASS");
  assert.equal(audit.hold_cleaning, true);
  assert.equal(audit.rendering, "idle");
  assert.equal(audit.gates["VOX-H08"], "PASS");
  assert.equal(audit.gates["VOX-H10"], "PASS");
  const pkg = JSON.parse(readFileSync(join(root, "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
});
