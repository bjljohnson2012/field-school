/**
 * Remotion soft craft notes for plates.
 * A note is recorded only when a caption cue drifts from spoken timing,
 * a chapter boundary is missing, or audio drifts from the Remotion timeline
 * or from caption cues.
 * This checker does not flip Cleaning.
 */

const FPS = 30;

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
  return { notes, cleaningFlip: false, holdCleaning: true };
}
