import {FPS} from "./tokens";
import {useCurrentFrame} from "remotion";
import type {MadeWord} from "./schema";

const WAITING = /^waiting\.$/i;
const PLAYBOOK = /^playbook[,.]?$/i;

export const waitingWord = (words: MadeWord[]): MadeWord | null => {
  return words.find((word) => WAITING.test(word.text.trim())) ?? null;
};

export const useWaitingSolo = (words: MadeWord[]): number => {
  const frame = useCurrentFrame();
  const target = waitingWord(words);
  const book = words.find((word) => PLAYBOOK.test(word.text.trim()));
  if (!target) {
    return 0;
  }
  const start = Math.round((target.fromMs / 1000) * FPS);
  const end = book ? Math.round((book.fromMs / 1000) * FPS) : start + Math.round(3 * FPS);
  if (frame < start || frame >= end) {
    return 0;
  }
  return 1;
};
