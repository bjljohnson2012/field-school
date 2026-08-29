import type {MadeWord} from "./schema";

export const normWord = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

export const heardSince = (words: MadeWord[], nowMs: number, fromMs = 0): string[] =>
  words.filter((word) => word.fromMs >= fromMs && nowMs >= word.fromMs).map((word) => normWord(word.text));

export const hasHeard = (heard: string[], needles: string[]): boolean =>
  needles.some((needle) => heard.some((token) => token === needle || token.includes(needle) || needle.includes(token)));
