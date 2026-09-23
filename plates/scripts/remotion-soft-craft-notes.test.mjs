import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { remotionSoftCraftNotes } from "./remotion-soft-craft-notes.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "remotion-soft-craft-notes.mjs"), "utf8");

const spoken = [
  { text: "Slate.", startMs: 10000, endMs: 10400 },
  { text: "Household:", startMs: 10400, endMs: 11200 },
  { text: "the", startMs: 11200, endMs: 11600 },
  { text: "child", startMs: 11600, endMs: 12200 },
  { text: "has", startMs: 12200, endMs: 12600 },
  { text: "no", startMs: 12600, endMs: 13000 },
  { text: "login.", startMs: 13000, endMs: 14000 },
];

const chapters = [
  { id: "sting", from: 0, frames: 300 },
  { id: "slate", from: 300, frames: 240 },
  { id: "objective", from: 540, frames: 180 },
  { id: "recap", from: 720, frames: 300 },
  { id: "next-up", from: 1020, frames: 210 },
];

const aligned = {
  text: "Slate. Household: the child has no login.",
  startMs: 10000,
  endMs: 14000,
};

test("aligned caption cues and chapter boundaries record no soft note", () => {
  const result = remotionSoftCraftNotes({ cues: [aligned], spoken, chapters, cleaningFlip: true });
  assert.deepEqual(result.notes, []);
  assert.equal(result.cleaningFlip, false);
  assert.equal(result.holdCleaning, true);
});

test("a caption cue that drifts from spoken timing is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [{ ...aligned, startMs: 10800 }],
    spoken,
    chapters,
  });
  assert.deepEqual(result.notes, [
    {
      kind: "caption-cue-drift",
      text: aligned.text,
      cueStartMs: 10800,
      cueEndMs: 14000,
      spokenStartMs: 10000,
      spokenEndMs: 14000,
    },
  ]);
  assert.equal(result.cleaningFlip, false);
});

test("a missing chapter boundary is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters: chapters.filter((row) => row.id !== "recap"),
  });
  assert.deepEqual(result.notes, [{ kind: "missing-chapter-boundary", id: "recap" }]);
  assert.equal(result.holdCleaning, true);
});

test("cue drift and a missing boundary are the only soft notes", () => {
  const result = remotionSoftCraftNotes({
    cues: [{ text: "Slate. Household:", startMs: 10000, endMs: 12000 }],
    spoken,
    chapters: chapters.filter((row) => row.id !== "objective"),
  });
  assert.deepEqual(
    result.notes.map((note) => note.kind),
    ["caption-cue-drift", "missing-chapter-boundary"],
  );
  assert.equal(result.notes[1].id, "objective");
  assert.equal(result.notes.some((note) => note.kind !== "caption-cue-drift" && note.kind !== "missing-chapter-boundary"), false);
});

test("the checker does not flip Cleaning or invent EDU-S03", () => {
  assert.match(source, /cleaningFlip: false/);
  assert.match(source, /holdCleaning: true/);
  assert.match(source, /kind: "audio-desync"/);
  assert.doesNotMatch(source, /EDU-S03|27pn9xs0zk8a73g|af374d95|distribute:\s*true|AUTH_URL|HARD_FAIL/);
  assert.doesNotMatch(source, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});

const syncedAudio = {
  id: "slate",
  from: 300,
  frames: 120,
  fps: 30,
  startMs: 10000,
  endMs: 14000,
  cueStartMs: 10000,
  cueEndMs: 14000,
};

test("audio locked to the timeline and caption cue records no soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
  });
  assert.deepEqual(result.notes, []);
  assert.equal(result.cleaningFlip, false);
});

test("audio that drifts from the Remotion timeline is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [{ ...syncedAudio, startMs: 10400 }],
  });
  assert.deepEqual(result.notes, [
    {
      kind: "audio-desync",
      id: "slate",
      audioStartMs: 10400,
      audioEndMs: 14000,
      timelineStartMs: 10000,
      timelineEndMs: 14000,
      cueStartMs: 10000,
      cueEndMs: 14000,
    },
  ]);
  assert.equal(result.holdCleaning, true);
});

test("audio that drifts from the caption cue is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [{ ...syncedAudio, cueEndMs: 14800 }],
  });
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0].kind, "audio-desync");
  assert.equal(result.notes[0].cueEndMs, 14800);
  assert.equal(result.notes[0].audioEndMs, 14000);
  assert.equal(result.cleaningFlip, false);
});

test("audio desync stays beside caption drift and a missing chapter boundary", () => {
  const result = remotionSoftCraftNotes({
    cues: [{ ...aligned, startMs: 10800 }],
    spoken,
    chapters: chapters.filter((row) => row.id !== "recap"),
    audio: [{ ...syncedAudio, startMs: 10400 }],
  });
  assert.deepEqual(
    result.notes.map((note) => note.kind),
    ["caption-cue-drift", "missing-chapter-boundary", "audio-desync"],
  );
  assert.equal(result.cleaningFlip, false);
  assert.equal(result.holdCleaning, true);
});
