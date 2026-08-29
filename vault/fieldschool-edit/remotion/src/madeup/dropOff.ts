import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {DROP_RETURN_LEAD_FRAMES, FPS, MIN_HOLD_MS} from "./tokens";
import type {MadeWord} from "./schema";

const WAITING = /^waiting\.$/i;

export const waitingWord = (words: MadeWord[]): MadeWord | null => {
  return words.find((word) => WAITING.test(word.text.trim())) ?? null;
};

export const useWaitingSolo = (words: MadeWord[]): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const target = waitingWord(words);
  if (!target) {
    return 0;
  }
  const start = Math.round((target.fromMs / 1000) * FPS);
  const end = Math.round(((target.fromMs + (target.toMs - target.fromMs) + MIN_HOLD_MS) / 1000) * FPS);
  const leave = spring({
    frame: frame - start,
    fps,
    durationInFrames: 32,
    config: {damping: 20, mass: 0.9},
  });
  const back = spring({
    frame: frame - (end - DROP_RETURN_LEAD_FRAMES),
    fps,
    durationInFrames: 28,
    config: {damping: 18, mass: 0.8},
  });
  if (frame < start || frame >= end) {
    return 0;
  }
  return Math.max(0, Math.min(1, leave - back));
};
