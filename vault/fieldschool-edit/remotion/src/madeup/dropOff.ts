import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {DROP_RETURN_LEAD_FRAMES, FPS} from "./tokens";
import type {MadeWord} from "./schema";

const WAITING = /^waiting\.$/i;
const PLAYBOOK = /^playbook[,.]?$/i;

export const waitingWord = (words: MadeWord[]): MadeWord | null => {
  return words.find((word) => WAITING.test(word.text.trim())) ?? null;
};

export const useWaitingSolo = (words: MadeWord[]): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const target = waitingWord(words);
  const book = words.find((word) => PLAYBOOK.test(word.text.trim()));
  if (!target) {
    return 0;
  }
  const start = Math.round((target.fromMs / 1000) * FPS);
  const end = book ? Math.round((book.fromMs / 1000) * FPS) : start + Math.round(3 * FPS);
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
