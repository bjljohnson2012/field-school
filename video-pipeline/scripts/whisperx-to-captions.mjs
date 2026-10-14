/**
 * WhisperX JSON → @remotion/captions Caption[].
 * Words missing start/end inherit the previous end + 80ms.
 */
import {readFileSync, writeFileSync} from "node:fs";

export function wordsFromWhisperx(data) {
  const raw = [];
  for (const segment of data.segments || []) {
    for (const word of segment.words || []) {
      raw.push({
        word: String(word.word || ""),
        start: word.start == null ? null : Number(word.start),
        end: word.end == null ? null : Number(word.end),
        score: word.score == null ? null : Number(word.score),
      });
    }
  }
  let prevEnd = 0;
  return raw.map((word) => {
    const start = word.start == null ? prevEnd + 0.08 : word.start;
    const end = word.end == null ? start + 0.2 : Math.max(word.end, start + 0.04);
    prevEnd = end;
    return {...word, start, end};
  });
}

export function toCaptions(words) {
  return words.map((word, index) => {
    const bare = word.word.trim();
    const text = index === 0 || bare.startsWith(" ") ? bare : ` ${bare}`;
    const startMs = Math.round(word.start * 1000);
    const endMs = Math.max(startMs + 40, Math.round(word.end * 1000));
    return {
      text,
      startMs,
      endMs,
      timestampMs: Math.round((startMs + endMs) / 2),
      confidence: word.score,
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input || !output) {
    console.error("usage: whisperx-to-captions.mjs <whisperx.json> <captions.json>");
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(input, "utf8"));
  writeFileSync(output, JSON.stringify(toCaptions(wordsFromWhisperx(data)), null, 2));
}
