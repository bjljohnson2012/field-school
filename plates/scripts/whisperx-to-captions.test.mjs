import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {collectWhisperxWords, whisperxWordsToCaptions} from "./whisperx-to-captions.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** WhisperX fixture: seconds on words[], one token already spaced, diarization absent. */
const FIXTURE = {
  segments: [
    {
      words: [
        {word: "Keep", start: 0.12, end: 0.48, score: 0.91, speaker: "SPEAKER_00"},
        {word: " moving", start: 0.5, end: 0.92, score: 0.88},
      ],
    },
    {
      words: [{word: "today.", start: 1.02, end: 1.4}],
    },
  ],
};

test("maps WhisperX words[] to Caption[] with a space and times in ms", () => {
  const captions = whisperxWordsToCaptions(collectWhisperxWords(FIXTURE));
  assert.deepEqual(captions, [
    {
      text: " Keep",
      startMs: 120,
      endMs: 480,
      timestampMs: null,
      confidence: null,
    },
    {
      text: " moving",
      startMs: 500,
      endMs: 920,
      timestampMs: null,
      confidence: null,
    },
    {
      text: " today.",
      startMs: 1020,
      endMs: 1400,
      timestampMs: null,
      confidence: null,
    },
  ]);
  for (const caption of captions) {
    assert.equal(caption.text.startsWith(" "), true);
    assert.equal(caption.text.slice(1).startsWith(" "), false);
    assert.equal("speaker" in caption, false);
    assert.equal("score" in caption, false);
  }
});

test("maps a bare words[] array", () => {
  const captions = whisperxWordsToCaptions([
    {word: "Path", start: 0.333, end: 0.667},
  ]);
  assert.deepEqual(captions, [
    {
      text: " Path",
      startMs: 333,
      endMs: 667,
      timestampMs: null,
      confidence: null,
    },
  ]);
});

test("plates depend on @remotion/captions at the Remotion pin", () => {
  const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
  assert.equal(pkg.dependencies["@remotion/captions"], "4.0.526");
});
