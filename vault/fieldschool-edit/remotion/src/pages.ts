import {MIN_HOLD_MS} from "./brand/tokens";
import type {CaptionWord} from "./schema/episode";

export type HoldPage = {
  words: CaptionWord[];
  appearMs: number;
  hideMs: number;
};

const GAP_MS = 400;

export const pagesWithHold = (words: CaptionWord[]): HoldPage[] => {
  if (words.length === 0) {
    return [];
  }
  const groups: CaptionWord[][] = [];
  let bucket: CaptionWord[] = [];
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

  const pages: HoldPage[] = [];
  for (const group of groups) {
    const first = group[0];
    const last = group[group.length - 1];
    const appearMs = first.fromMs;
    const hideMs = Math.max(last.toMs + MIN_HOLD_MS, appearMs + MIN_HOLD_MS);
    pages.push({words: group, appearMs, hideMs});
  }
  return pages;
};

export const pageAt = (pages: HoldPage[], nowMs: number): HoldPage | null => {
  const spoken = pages.find((page) => page.words.some((word) => nowMs >= word.fromMs && nowMs < word.toMs));
  if (spoken) {
    return spoken;
  }
  const hits = pages.filter((page) => nowMs >= page.appearMs && nowMs < page.hideMs);
  return hits[hits.length - 1] ?? null;
};
