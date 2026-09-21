import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {
  PLAY_RAIL_LOCKED_DEST,
  PLAY_RAIL_LOCKED_SHA256,
  destAllowed,
  playRailCleaningAutoFlipReady,
  runPlayRailAutoFlip,
} from "./cleaning-auto-flip-play-rail.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "cleaning-auto-flip-play-rail.mjs");
const checklist = join(here, "cleaning-checklist-lesson-spine.mjs");
const ANALOGY = "/opt/cursor/artifacts/lesson-spine-analogy-encode/2026-09-21/LessonSpine.mp4";
const ANALOGY_SHA = "a556a0b5a2beaec4b0cc44eadcbf6c092cd152a568282ce3eee06564be01af37";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("play-rail auto-flip PASS only on locked dest af374d95", () => {
  assert.equal(existsSync(PLAY_RAIL_LOCKED_DEST), true);
  const before = sha256(PLAY_RAIL_LOCKED_DEST);
  assert.equal(before, PLAY_RAIL_LOCKED_SHA256);
  const result = runPlayRailAutoFlip({dest: PLAY_RAIL_LOCKED_DEST});
  assert.equal(result.ok, true, result.note);
  assert.equal(result.hold_cleaning, false);
  assert.equal(result.auto_flip, true);
  assert.equal(result.scope, "play-rail");
  assert.equal(result.distribute, false);
  assert.equal(result.sha256, PLAY_RAIL_LOCKED_SHA256);
  assert.equal(sha256(PLAY_RAIL_LOCKED_DEST), before);
  const rules = readFileSync(join(here, "../../app/src/lib/plates/rules.ts"), "utf8");
  assert.match(rules, /checklistExit === 0 && input\.shipGreen && !input\.holdCleaning/);
});

test("play-rail auto-flip refuses analogy dest even if file exists", () => {
  assert.equal(existsSync(ANALOGY), true);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  const result = runPlayRailAutoFlip({dest: ANALOGY});
  assert.equal(result.ok, false);
  assert.equal(result.hold_cleaning, true);
  assert.equal(result.auto_flip, false);
  assert.equal(result.refuseReason, "dest_sha_mismatch");
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
});

test("play-rail auto-flip refuses Just and Aug30 dests", () => {
  assert.equal(destAllowed("/opt/fieldschool-video/hls/27pn9xs0zk8a73g/master.mp4"), false);
  assert.equal(destAllowed("/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4"), false);
  const just = runPlayRailAutoFlip({
    dest: "/opt/fieldschool-video/hls/27pn9xs0zk8a73g/master.mp4",
    checklist: {exitCode: 0, verdict: "PASS"},
  });
  assert.equal(just.ok, false);
  assert.equal(just.hold_cleaning, true);
  assert.equal(just.refuseReason, "dest_not_allowed");
});

test("old checklist --flip stays refused; play-rail refuses --distribute", () => {
  const flip = spawnSync(process.execPath, [checklist, "--flip"], {encoding: "utf8"});
  assert.equal(flip.status, 2);
  assert.equal(JSON.parse(flip.stdout).error, "flip_refused");
  const dist = spawnSync(process.execPath, [script, "--distribute"], {encoding: "utf8"});
  assert.equal(dist.status, 2);
  assert.equal(JSON.parse(dist.stdout).error, "distribute_held");
});

test("playRailCleaningAutoFlipReady is dest-scoped", () => {
  assert.equal(
    playRailCleaningAutoFlipReady({
      checklistExit: 0,
      destSha256: PLAY_RAIL_LOCKED_SHA256,
      destOk: true,
    }),
    true,
  );
  assert.equal(
    playRailCleaningAutoFlipReady({
      checklistExit: 1,
      destSha256: PLAY_RAIL_LOCKED_SHA256,
      destOk: true,
    }),
    false,
  );
  assert.equal(
    playRailCleaningAutoFlipReady({
      checklistExit: 0,
      destSha256: ANALOGY_SHA,
      destOk: true,
    }),
    false,
  );
});
