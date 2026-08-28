import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {DROP_RETURN_LEAD_FRAMES, MIN_HOLD_MS} from "./brand/tokens";
import {pageAt, pagesWithHold, type HoldPage} from "./pages";
import type {CaptionWord} from "./schema/episode";

export type DropOff = {
  fromMs: number;
  durationMs: number;
};

const EMPHASIS = /^waiting\.$/i;

export const emphasisDropOff = (words: CaptionWord[]): DropOff | null => {
  const target = words.find((word) => EMPHASIS.test(word.text.trim()));
  if (!target) {
    return null;
  }
  return {fromMs: target.fromMs, durationMs: target.toMs - target.fromMs + MIN_HOLD_MS};
};

export const pageForClock = (words: CaptionWord[], nowMs: number, drop: DropOff | null): HoldPage | null => {
  const pages = pagesWithHold(words);
  if (drop && nowMs >= drop.fromMs && nowMs < drop.fromMs + drop.durationMs) {
    const locked = pages.find((page) => page.words.some((word) => word.fromMs === drop.fromMs));
    if (locked) {
      return locked;
    }
  }
  return pageAt(pages, nowMs);
};

export const useSolo = (drop: DropOff | null, originMs: number): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!drop) {
    return 0;
  }
  const start = Math.round(((drop.fromMs - originMs) / 1000) * fps);
  const end = Math.round(((drop.fromMs + drop.durationMs - originMs) / 1000) * fps);
  const leave = spring({
    frame: frame - start,
    fps,
    durationInFrames: 22,
    config: {damping: 16, mass: 0.7},
  });
  const back = spring({
    frame: frame - (end - DROP_RETURN_LEAD_FRAMES),
    fps,
    durationInFrames: 20,
    config: {damping: 14, mass: 0.55},
  });
  if (frame < start || frame >= end) {
    return 0;
  }
  return Math.max(0, Math.min(1, leave - back));
};
