import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {MIN_HOLD_MS} from "./brand/tokens";
import type {CaptionWord} from "./schema/episode";

export type VignetteId = "wait" | "playbook";

export type VignetteCue = {
  id: VignetteId;
  fromMs: number;
  holdMs: number;
};

const WAIT = /^waiting\.$/i;
const BOOK = /^playbook\.?$/i;

export const vignetteCues = (words: CaptionWord[]): VignetteCue[] => {
  const wait = words.find((word) => WAIT.test(word.text.trim()));
  const book = words.find((word) => BOOK.test(word.text.trim()));
  const cues: VignetteCue[] = [];
  if (wait) {
    cues.push({id: "wait", fromMs: wait.fromMs, holdMs: wait.toMs - wait.fromMs + MIN_HOLD_MS});
  }
  if (book) {
    cues.push({id: "playbook", fromMs: book.fromMs, holdMs: Math.max(MIN_HOLD_MS, book.toMs - book.fromMs + 800)});
  }
  return cues.sort((a, b) => a.fromMs - b.fromMs);
};

export const vignetteLiftAt = (cues: VignetteCue[], nowMs: number): number => {
  for (const cue of cues) {
    if (nowMs >= cue.fromMs && nowMs < cue.fromMs + cue.holdMs) {
      return 1;
    }
  }
  return 0;
};

export const usePaper = (fromMs: number, holdMs: number, originMs: number, nextFromMs: number | null) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(((fromMs - originMs) / 1000) * fps);
  const naturalEnd = Math.round(((fromMs + holdMs - originMs) / 1000) * fps);
  const next = nextFromMs === null ? naturalEnd : Math.round(((nextFromMs - originMs) / 1000) * fps);
  const end = Math.min(naturalEnd, next);
  const enter = spring({
    frame: frame - start,
    fps,
    durationInFrames: 18,
    config: {damping: 13, mass: 0.5},
  });
  const leave = spring({
    frame: frame - (end - 16),
    fps,
    durationInFrames: 16,
    config: {damping: 14, mass: 0.55},
  });
  if (frame < start || frame >= end) {
    return 0;
  }
  return Math.max(0, Math.min(1, enter - leave));
};
