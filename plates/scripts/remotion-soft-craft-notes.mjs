/**
 * Remotion soft craft notes for plates.
 * A note is recorded only when a caption cue drifts from spoken timing,
 * a chapter boundary is missing, audio drifts from the Remotion timeline
 * or from caption cues, or a composition is missing useCurrentFrame
 * or drives motion with a CSS timer, or master length falls outside
 * the Guo 6 minute practice band and the Lagerstrom 12–20 minute for-credit band,
 * or frame-to-frame flicker or a flash pattern is detected.
 * This checker does not flip Cleaning.
 */

const FPS = 30;
const FLICKER_DELTA = 0.5;
const FLASH_WINDOW = FPS;
const FLASH_REVERSALS = 3;
const PRACTICE_MAX_SEC = 6 * 60;
const CREDIT_MIN_SEC = 12 * 60;
const CREDIT_MAX_SEC = 20 * 60;

const REQUIRED_CHAPTERS = ["sting", "slate", "objective", "recap", "nextUp"];

function normalize(text) {
  return String(text ?? "").trim().replace(/\s+/g, " ");
}

function chapterId(row) {
  const id = String(row?.id ?? row?.name ?? "");
  return id === "next-up" ? "nextUp" : id;
}

function hasBoundary(row) {
  if (!row) return false;
  if (Number.isFinite(row.from) && Number.isFinite(row.frames)) {
    return row.from >= 0 && row.frames >= 1;
  }
  if (Number.isFinite(row.startSec) && Number.isFinite(row.endSec)) {
    return row.startSec >= 0 && row.endSec > row.startSec;
  }
  return false;
}

function spokenSpan(cue, spoken) {
  const want = normalize(cue?.text);
  if (!want) return null;
  const words = (spoken ?? [])
    .map((word) => ({
      text: normalize(word?.text),
      startMs: word?.startMs,
      endMs: word?.endMs,
    }))
    .filter((word) => word.text && Number.isFinite(word.startMs) && Number.isFinite(word.endMs));
  for (let start = 0; start < words.length; start++) {
    let joined = "";
    for (let end = start; end < words.length; end++) {
      joined = joined ? `${joined} ${words[end].text}` : words[end].text;
      if (joined === want) {
        return { startMs: words[start].startMs, endMs: words[end].endMs };
      }
      if (!want.startsWith(joined)) break;
    }
  }
  return null;
}

function timelineWindow(clip) {
  if (Number.isFinite(clip?.timelineStartMs) && Number.isFinite(clip?.timelineEndMs)) {
    return { startMs: clip.timelineStartMs, endMs: clip.timelineEndMs };
  }
  if (Number.isFinite(clip?.from) && Number.isFinite(clip?.frames) && clip.frames >= 1) {
    const fps = Number.isFinite(clip.fps) && clip.fps > 0 ? clip.fps : FPS;
    return {
      startMs: Math.round((clip.from / fps) * 1000),
      endMs: Math.round(((clip.from + clip.frames) / fps) * 1000),
    };
  }
  return null;
}

function cueWindow(clip) {
  if (!Number.isFinite(clip?.cueStartMs) || !Number.isFinite(clip?.cueEndMs)) return null;
  return { startMs: clip.cueStartMs, endMs: clip.cueEndMs };
}

function audioNotes(clips) {
  const notes = [];
  for (const clip of clips ?? []) {
    if (!Number.isFinite(clip?.startMs) || !Number.isFinite(clip?.endMs)) continue;
    const timeline = timelineWindow(clip);
    const cue = cueWindow(clip);
    if (!timeline && !cue) continue;
    const timelineDrift = timeline && (clip.startMs !== timeline.startMs || clip.endMs !== timeline.endMs);
    const cueDrift = cue && (clip.startMs !== cue.startMs || clip.endMs !== cue.endMs);
    if (!timelineDrift && !cueDrift) continue;
    notes.push({
      kind: "audio-desync",
      id: clip.id ? String(clip.id) : "",
      audioStartMs: clip.startMs,
      audioEndMs: clip.endMs,
      timelineStartMs: timeline ? timeline.startMs : null,
      timelineEndMs: timeline ? timeline.endMs : null,
      cueStartMs: cue ? cue.startMs : null,
      cueEndMs: cue ? cue.endMs : null,
    });
  }
  return notes;
}

function compositionSource(row) {
  return String(row?.source ?? "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function frameNotes(compositions) {
  const notes = [];
  for (const row of compositions ?? []) {
    const source = compositionSource(row);
    if (!source.trim()) continue;
    const id = row.id ? String(row.id) : "";
    const hasFrame = /\buseCurrentFrame\b/.test(source);
    const cssTimer = /@keyframes|\banimation\s*:|\btransition\s*:/.test(source);
    const frameMotion = /\binterpolate\s*\(|\bspring\s*\(/.test(source);
    if (!hasFrame && frameMotion) notes.push({ kind: "missing-use-current-frame", id });
    if (cssTimer) notes.push({ kind: "css-timer-motion", id });
  }
  return notes;
}

function inDurationBand(seconds) {
  if (seconds <= PRACTICE_MAX_SEC) return true;
  return seconds >= CREDIT_MIN_SEC && seconds <= CREDIT_MAX_SEC;
}

function durationNotes(rows) {
  const notes = [];
  for (const row of rows ?? []) {
    const seconds = row?.seconds;
    if (!Number.isFinite(seconds) || seconds < 0) continue;
    if (inDurationBand(seconds)) continue;
    notes.push({
      kind: "duration-band",
      id: row.id ? String(row.id) : "",
      seconds,
      practiceMaxSec: PRACTICE_MAX_SEC,
      creditMinSec: CREDIT_MIN_SEC,
      creditMaxSec: CREDIT_MAX_SEC,
    });
  }
  return notes;
}

function lumaSeries(values) {
  if (!Array.isArray(values) || values.length < 2) return null;
  if (values.some((value) => !Number.isFinite(value))) return null;
  const scale = values.some((value) => value > 1) ? 255 : 1;
  return values.map((value) => value / scale);
}

function largeSteps(luma) {
  const steps = [];
  for (let index = 1; index < luma.length; index++) {
    const delta = luma[index] - luma[index - 1];
    if (Math.abs(delta) >= FLICKER_DELTA) steps.push({ index, delta });
  }
  return steps;
}

function flickerPattern(steps) {
  let frame = false;
  for (let index = 1; index < steps.length; index++) {
    const prev = steps[index - 1];
    const next = steps[index];
    if (next.index === prev.index + 1 && next.delta * prev.delta < 0) frame = true;
  }
  let flash = false;
  for (let start = 0; start < steps.length; start++) {
    let reversals = 0;
    for (let index = start + 1; index < steps.length; index++) {
      if (steps[index].index - steps[start].index > FLASH_WINDOW) break;
      if (steps[index].delta * steps[index - 1].delta < 0) reversals += 1;
    }
    if (reversals >= FLASH_REVERSALS) flash = true;
  }
  if (frame && flash) return "both";
  if (frame) return "frame";
  if (flash) return "flash";
  return null;
}

function flickerNotes(rows) {
  const notes = [];
  for (const row of rows ?? []) {
    const luma = lumaSeries(row?.luma);
    if (!luma) continue;
    const pattern = flickerPattern(largeSteps(luma));
    if (!pattern) continue;
    notes.push({
      kind: "flicker",
      id: row.id ? String(row.id) : "",
      pattern,
    });
  }
  return notes;
}

/** Soft notes only. Cleaning stays held. */
export function remotionSoftCraftNotes(input = {}) {
  const notes = [];
  const spoken = input.spoken ?? [];
  for (const cue of input.cues ?? []) {
    const text = normalize(cue?.text);
    if (!text) continue;
    const span = spokenSpan(cue, spoken);
    const drifted = !span || cue.startMs !== span.startMs || cue.endMs !== span.endMs;
    if (!drifted) continue;
    notes.push({
      kind: "caption-cue-drift",
      text,
      cueStartMs: Number.isFinite(cue.startMs) ? cue.startMs : null,
      cueEndMs: Number.isFinite(cue.endMs) ? cue.endMs : null,
      spokenStartMs: span ? span.startMs : null,
      spokenEndMs: span ? span.endMs : null,
    });
  }
  const chapters = input.chapters ?? [];
  for (const id of REQUIRED_CHAPTERS) {
    const row = chapters.find((chapter) => chapterId(chapter) === id);
    if (hasBoundary(row)) continue;
    notes.push({ kind: "missing-chapter-boundary", id });
  }
  notes.push(...audioNotes(input.audio));
  notes.push(...frameNotes(input.compositions));
  notes.push(...durationNotes(input.durations));
  notes.push(...flickerNotes(input.flicker));
  return { notes, cleaningFlip: false, holdCleaning: true };
}
