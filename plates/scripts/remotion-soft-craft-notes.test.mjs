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
  assert.match(source, /kind: "missing-use-current-frame"/);
  assert.match(source, /kind: "css-timer-motion"/);
  assert.match(source, /kind: "duration-band"/);
  assert.match(source, /kind: "flicker"/);
  assert.match(source, /kind: "wcag-contrast"/);
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

const frameDriven = `
import { useCurrentFrame, interpolate } from "remotion";
export function Beat() {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, 20], [0, 1]);
}
`;

test("a composition on useCurrentFrame records no soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    cleaningFlip: true,
  });
  assert.deepEqual(result.notes, []);
  assert.equal(result.cleaningFlip, false);
});

test("motion without useCurrentFrame is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Slate", source: "interpolate(frame, [0, 10], [0, 1]);" }],
  });
  assert.deepEqual(result.notes, [{ kind: "missing-use-current-frame", id: "Slate" }]);
  assert.equal(result.holdCleaning, true);
});

test("CSS-timer motion is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Slate", source: `${frameDriven}\nconst style = { transition: "opacity 1s" };` }],
  });
  assert.deepEqual(result.notes, [{ kind: "css-timer-motion", id: "Slate" }]);
  assert.equal(result.cleaningFlip, false);
});

test("frame smells stay beside caption, chapter, and audio notes", () => {
  const result = remotionSoftCraftNotes({
    cues: [{ ...aligned, startMs: 10800 }],
    spoken,
    chapters: chapters.filter((row) => row.id !== "recap"),
    audio: [{ ...syncedAudio, startMs: 10400 }],
    compositions: [{ id: "Slate", source: 'interpolate(0, [0, 1], [0, 1]);\n@keyframes spin {}\nanimation: spin 1s;' }],
  });
  assert.deepEqual(
    result.notes.map((note) => note.kind),
    [
      "caption-cue-drift",
      "missing-chapter-boundary",
      "audio-desync",
      "missing-use-current-frame",
      "css-timer-motion",
    ],
  );
  assert.equal(result.cleaningFlip, false);
  assert.equal(result.holdCleaning, true);
});

test("Guo practice and Lagerstrom for-credit lengths record no soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [
      { id: "practice", seconds: 6 * 60 },
      { id: "credit-short", seconds: 12 * 60 },
      { id: "credit-long", seconds: 20 * 60 },
    ],
    cleaningFlip: true,
  });
  assert.deepEqual(result.notes, []);
  assert.equal(result.cleaningFlip, false);
});

test("a length outside both duration bands is the only soft note", () => {
  const gap = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [{ id: "LessonSpine", seconds: 11 * 60 }],
  });
  assert.deepEqual(gap.notes, [
    {
      kind: "duration-band",
      id: "LessonSpine",
      seconds: 11 * 60,
      practiceMaxSec: 6 * 60,
      creditMinSec: 12 * 60,
      creditMaxSec: 20 * 60,
    },
  ]);
  const over = remotionSoftCraftNotes({
    durations: [{ id: "sit-down", seconds: 21 * 60 }],
    chapters,
    cues: [aligned],
    spoken,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
  });
  assert.equal(over.notes.length, 1);
  assert.equal(over.notes[0].kind, "duration-band");
  assert.equal(over.notes[0].seconds, 21 * 60);
  assert.equal(over.holdCleaning, true);
});

test("a duration-band note stays beside the earlier soft notes", () => {
  const result = remotionSoftCraftNotes({
    cues: [{ ...aligned, startMs: 10800 }],
    spoken,
    chapters: chapters.filter((row) => row.id !== "recap"),
    audio: [{ ...syncedAudio, startMs: 10400 }],
    compositions: [{ id: "Slate", source: 'interpolate(0, [0, 1], [0, 1]);\n@keyframes spin {}\nanimation: spin 1s;' }],
    durations: [{ id: "LessonSpine", seconds: 7 * 60 }],
  });
  assert.deepEqual(
    result.notes.map((note) => note.kind),
    [
      "caption-cue-drift",
      "missing-chapter-boundary",
      "audio-desync",
      "missing-use-current-frame",
      "css-timer-motion",
      "duration-band",
    ],
  );
  assert.equal(result.cleaningFlip, false);
  assert.equal(result.holdCleaning, true);
});

function held(value, count) {
  return Array.from({ length: count }, () => value);
}

test("a steady fade and a single cut record no flicker note", () => {
  const fade = Array.from({ length: 20 }, (_, index) => index / 19);
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [{ id: "practice", seconds: 6 * 60 }],
    flicker: [
      { id: "fade", luma: fade },
      { id: "cut", luma: [0, 0, 0, 1, 1, 1] },
    ],
    cleaningFlip: true,
  });
  assert.deepEqual(result.notes, []);
  assert.equal(result.cleaningFlip, false);
});

test("frame-to-frame flicker is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [{ id: "practice", seconds: 6 * 60 }],
    flicker: [{ id: "slate", luma: [0, 1, 0] }],
  });
  assert.deepEqual(result.notes, [{ kind: "flicker", id: "slate", pattern: "frame" }]);
  assert.equal(result.holdCleaning, true);
});

test("a flash pattern is the only soft note", () => {
  const luma = [...held(0, 8), ...held(1, 8), ...held(0, 8), ...held(1, 8), ...held(0, 8)];
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [{ id: "practice", seconds: 6 * 60 }],
    flicker: [{ id: "slate", luma }],
  });
  assert.deepEqual(result.notes, [{ kind: "flicker", id: "slate", pattern: "flash" }]);
  assert.equal(result.cleaningFlip, false);
});

test("a flicker note stays beside the earlier soft notes", () => {
  const result = remotionSoftCraftNotes({
    cues: [{ ...aligned, startMs: 10800 }],
    spoken,
    chapters: chapters.filter((row) => row.id !== "recap"),
    audio: [{ ...syncedAudio, startMs: 10400 }],
    compositions: [{ id: "Slate", source: 'interpolate(0, [0, 1], [0, 1]);\n@keyframes spin {}\nanimation: spin 1s;' }],
    durations: [{ id: "LessonSpine", seconds: 7 * 60 }],
    flicker: [{ id: "slate", luma: [0, 1, 0] }],
  });
  assert.deepEqual(
    result.notes.map((note) => note.kind),
    [
      "caption-cue-drift",
      "missing-chapter-boundary",
      "audio-desync",
      "missing-use-current-frame",
      "css-timer-motion",
      "duration-band",
      "flicker",
    ],
  );
  assert.equal(result.notes.at(-1).pattern, "frame");
  assert.equal(result.cleaningFlip, false);
  assert.equal(result.holdCleaning, true);
});

const inkOnCream = { foreground: "#1A1A16", background: "#EFE7D6" };
const goldOnCream = { foreground: "#C4A35A", background: "#EFE7D6" };

test("passing text and critical marks record no contrast note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [{ id: "practice", seconds: 6 * 60 }],
    flicker: [{ id: "fade", luma: Array.from({ length: 20 }, (_, index) => index / 19) }],
    contrast: [
      { id: "body", role: "text", ...inkOnCream },
      { id: "tick", role: "mark", ...inkOnCream },
      { id: "kicker", role: "text", foreground: "#6B7F4F", background: "#EFE7D6", large: true },
    ],
    cleaningFlip: true,
  });
  assert.deepEqual(result.notes, []);
  assert.equal(result.cleaningFlip, false);
});

test("on-screen text that fails WCAG contrast is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [{ id: "practice", seconds: 6 * 60 }],
    flicker: [{ id: "cut", luma: [0, 0, 0, 1, 1, 1] }],
    contrast: [{ id: "body", role: "text", ...goldOnCream }],
  });
  assert.deepEqual(result.notes, [
    {
      kind: "wcag-contrast",
      id: "body",
      role: "text",
      foreground: "#C4A35A",
      background: "#EFE7D6",
      ratio: 1.95,
      minimum: 4.5,
    },
  ]);
  assert.equal(result.holdCleaning, true);
});

test("a critical mark that fails WCAG contrast is the only soft note", () => {
  const result = remotionSoftCraftNotes({
    cues: [aligned],
    spoken,
    chapters,
    audio: [syncedAudio],
    compositions: [{ id: "Opener", source: frameDriven }],
    durations: [{ id: "practice", seconds: 6 * 60 }],
    contrast: [
      { id: "body", role: "text", ...inkOnCream },
      { id: "tick", role: "mark", foreground: "#8A8A80", background: "#EFE7D6" },
    ],
  });
  assert.deepEqual(result.notes, [
    {
      kind: "wcag-contrast",
      id: "tick",
      role: "mark",
      foreground: "#8A8A80",
      background: "#EFE7D6",
      ratio: 2.83,
      minimum: 3,
    },
  ]);
  assert.equal(result.cleaningFlip, false);
});

test("a contrast note stays beside the earlier soft notes", () => {
  const result = remotionSoftCraftNotes({
    cues: [{ ...aligned, startMs: 10800 }],
    spoken,
    chapters: chapters.filter((row) => row.id !== "recap"),
    audio: [{ ...syncedAudio, startMs: 10400 }],
    compositions: [{ id: "Slate", source: "interpolate(0, [0, 1], [0, 1]);\n@keyframes spin {}\nanimation: spin 1s;" }],
    durations: [{ id: "LessonSpine", seconds: 7 * 60 }],
    flicker: [{ id: "slate", luma: [0, 1, 0] }],
    contrast: [{ id: "body", role: "text", ...goldOnCream }],
  });
  assert.deepEqual(
    result.notes.map((note) => note.kind),
    [
      "caption-cue-drift",
      "missing-chapter-boundary",
      "audio-desync",
      "missing-use-current-frame",
      "css-timer-motion",
      "duration-band",
      "flicker",
      "wcag-contrast",
    ],
  );
  assert.equal(result.notes.at(-1).ratio, 1.95);
  assert.equal(result.cleaningFlip, false);
  assert.equal(result.holdCleaning, true);
});
