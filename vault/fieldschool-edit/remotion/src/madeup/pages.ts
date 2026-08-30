import {MIN_HOLD_MS} from "./tokens";
import type {MadeWord} from "./schema";

export type HoldPage = {
  words: MadeWord[];
  appearMs: number;
  hideMs: number;
};

const GAP_MS = 400;

export const pagesWithHold = (words: MadeWord[]): HoldPage[] => {
  if (words.length === 0) {
    return [];
  }
  const groups: MadeWord[][] = [];
  let bucket: MadeWord[] = [];
  for (const word of words) {
    const prev = bucket[bucket.length - 1];
    if (prev && word.fromMs - prev.toMs >= GAP_MS) {
      groups.push(bucket);
      bucket = [];
    }
    bucket.push(word);
  }
  if (bucket.length > 0) {
    groups.push(bucket);
  }
  return groups.map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    const appearMs = first.fromMs;
    return {
      words: group,
      appearMs,
      hideMs: Math.max(last.toMs + MIN_HOLD_MS, appearMs + MIN_HOLD_MS),
    };
  });
};

export const pageAt = (pages: HoldPage[], nowMs: number): HoldPage | null => {
  const spoken = pages.find((page) => page.words.some((word) => nowMs >= word.fromMs && nowMs < word.toMs));
  if (spoken) {
    return spoken;
  }
  const hits = pages.filter((page) => nowMs >= page.appearMs && nowMs < page.hideMs);
  return hits[hits.length - 1] ?? null;
};

export const pageForClock = (words: MadeWord[], nowMs: number, lockFromMs: number | null): HoldPage | null => {
  const pages = pagesWithHold(words);
  if (lockFromMs !== null) {
    const locked = pages.find((page) => page.words.some((word) => word.fromMs === lockFromMs));
    if (locked && nowMs >= lockFromMs && nowMs < lockFromMs + MIN_HOLD_MS + 400) {
      return locked;
    }
  }
  return pageAt(pages, nowMs);
};
