import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

/**
 * Map WhisperX words[] to @remotion/captions Caption[].
 * One space before each word. start/end seconds become startMs/endMs.
 * Diarization is off: speaker labels are ignored.
 */

export function collectWhisperxWords(doc) {
  if (Array.isArray(doc)) return doc;
  if (doc && Array.isArray(doc.words)) return doc.words;
  if (doc && Array.isArray(doc.segments)) {
    return doc.segments.flatMap((segment) =>
      segment && Array.isArray(segment.words) ? segment.words : [],
    );
  }
  throw new TypeError("expected WhisperX words[] or segments[].words[]");
}

export function whisperxWordsToCaptions(words) {
  if (!Array.isArray(words)) {
    throw new TypeError("whisperx words[] must be an array");
  }
  return words.map((word, index) => {
    if (!word || typeof word !== "object") {
      throw new TypeError(`whisperx word ${index} must be an object`);
    }
    const raw = String(word.word ?? "").replace(/^\s+/, "");
    if (!raw) {
      throw new TypeError(`whisperx word ${index} is empty`);
    }
    const start = Number(word.start);
    const end = Number(word.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new TypeError(`whisperx word ${index} needs start and end in seconds`);
    }
    return {
      text: ` ${raw}`,
      startMs: Math.round(start * 1000),
      endMs: Math.round(end * 1000),
      timestampMs: null,
      confidence: null,
    };
  });
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const file = process.argv[2];
  const raw = file ? readFileSync(file, "utf8") : readFileSync(0, "utf8");
  const captions = whisperxWordsToCaptions(collectWhisperxWords(JSON.parse(raw)));
  process.stdout.write(`${JSON.stringify(captions, null, 2)}\n`);
}
