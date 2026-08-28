import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {DROP_RETURN_LEAD_FRAMES, FPS, MIN_HOLD_MS} from "./brand/tokens";
import type {CaptionWord} from "./schema/episode";

export type VignetteId = "wait" | "playbook";

export type VignetteCue = {
  id: VignetteId;
  fromMs: number;
  holdMs: number;
};

export const PAPER_ENTER_FRAMES = 18;
export const PAPER_LEAVE_FRAMES = 16;

const WAIT = /^waiting\.$/i;
const BOOK = /^playbook\.?$/i;
const WAIT_CLEAR_MS = ((DROP_RETURN_LEAD_FRAMES + PAPER_LEAVE_FRAMES) / FPS) * 1000;

export const vignetteCues = (words: CaptionWord[]): VignetteCue[] => {
  const wait = words.find((word) => WAIT.test(word.text.trim()));
  const book = words.find((word) => BOOK.test(word.text.trim()));
  const cues: VignetteCue[] = [];
  if (wait) {
    const spoken = wait.toMs - wait.fromMs + MIN_HOLD_MS;
    cues.push({
      id: "wait",
      fromMs: wait.fromMs,
      holdMs: Math.max(1900, spoken - WAIT_CLEAR_MS),
    });
  }
  if (book) {
    cues.push({
      id: "playbook",
      fromMs: book.fromMs,
      holdMs: Math.max(MIN_HOLD_MS, book.toMs - book.fromMs + 800),
    });
  }
  return cues.sort((a, b) => a.fromMs - b.fromMs);
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
    durationInFrames: PAPER_ENTER_FRAMES,
    config: {damping: 13, mass: 0.5},
  });
  const leave = spring({
    frame: frame - (end - PAPER_LEAVE_FRAMES),
    fps,
    durationInFrames: PAPER_LEAVE_FRAMES,
    config: {damping: 14, mass: 0.55},
  });
  if (frame < start || frame >= end) {
    return 0;
  }
  return Math.max(0, Math.min(1, enter - leave));
};

export const useVignetteLift = (cues: VignetteCue[], originMs: number): number => {
  const first = cues[0];
  const second = cues[1];
  const openFirst = usePaper(
    first ? first.fromMs : 0,
    first ? first.holdMs : 0,
    originMs,
    second ? second.fromMs : null,
  );
  const openSecond = usePaper(second ? second.fromMs : 0, second ? second.holdMs : 0, originMs, null);
  return Math.max(first ? openFirst : 0, second ? openSecond : 0);
};
