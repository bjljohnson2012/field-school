import {normWord} from "./spoken";
import type {MadePhrase, MadeWord} from "./schema";

export type PhrasePage = {
  words: MadeWord[];
  appearMs: number;
  hideMs: number;
  authored?: boolean;
};

const FILLER = /^(um|uh|uhh|so)$/i;
const ENDS = /[.!?]$/;
const MIN_WORDS = 3;
const MAX_WORDS = 8;
const GAP_MS = 420;

const bare = (text: string): string => text.trim();

export const isFiller = (text: string): boolean => FILLER.test(normWord(text));

const matchAuthored = (line: string, spoken: MadeWord[], fromMs: number, untilMs: number): MadeWord[] => {
  const tokens = line.split(/\s+/).filter(Boolean);
  const pool = spoken.filter((word) => word.fromMs >= fromMs - 80 && word.fromMs < untilMs);
  const used = new Set<number>();
  const hits: MadeWord[] = [];
  let cursor = 0;
  for (const token of tokens) {
    const needle = normWord(token);
    let found: MadeWord | undefined;
    for (let i = cursor; i < pool.length; i += 1) {
      if (used.has(i)) {
        continue;
      }
      const have = normWord(pool[i].text);
      if (have === needle || have.includes(needle) || needle.includes(have)) {
        found = pool[i];
        used.add(i);
        cursor = i + 1;
        break;
      }
    }
    hits.push(
      found
        ? {...found, text: token}
        : {
            text: token,
            fromMs,
            toMs: fromMs,
          },
    );
  }
  return hits;
};

export const authoredPages = (phrases: MadePhrase[], spoken: MadeWord[], untilMs: number): PhrasePage[] => {
  return phrases.map((phrase, i) => {
    const next = phrases[i + 1];
    const hideMs = next ? next.fromMs : Math.max(untilMs, phrase.fromMs + 900);
    const words = matchAuthored(phrase.text, spoken, phrase.fromMs, hideMs);
    return {
      words,
      appearMs: phrase.fromMs,
      hideMs,
      authored: true,
    };
  });
};

export const autoPages = (spoken: MadeWord[], fromMs: number, toMs: number): PhrasePage[] => {
  const span = spoken.filter((word) => word.fromMs >= fromMs && word.fromMs < toMs && !isFiller(word.text));
  const groups: MadeWord[][] = [];
  let bucket: MadeWord[] = [];
  const flush = () => {
    if (bucket.length > 0) {
      groups.push(bucket);
      bucket = [];
    }
  };
  for (const word of span) {
    const prev = bucket[bucket.length - 1];
    const gap = prev ? word.fromMs - prev.toMs : 0;
    const full = bucket.length >= MAX_WORDS;
    const punct = prev ? ENDS.test(bare(prev.text)) && bucket.length >= MIN_WORDS : false;
    const silence = prev ? gap >= GAP_MS && bucket.length >= MIN_WORDS : false;
    if (full || punct || silence) {
      flush();
    }
    const sameWeak =
      prev &&
      /^(that|the|a|and|to|of|it)$/i.test(normWord(prev.text)) &&
      normWord(prev.text) === normWord(word.text);
    if (sameWeak) {
      continue;
    }
    bucket.push({...word, text: bare(word.text)});
  }
  flush();
  return groups.map((group, i) => {
    const next = groups[i + 1];
    return {
      words: group,
      appearMs: group[0].fromMs,
      hideMs: next ? next[0].fromMs : Math.max(toMs, group[group.length - 1].toMs + 700),
    };
  });
};

export const pagesForShot = (
  spoken: MadeWord[],
  fromMs: number,
  toMs: number,
  phrases?: MadePhrase[],
): PhrasePage[] => {
  if (phrases && phrases.length > 0) {
    return authoredPages(phrases, spoken, toMs);
  }
  return autoPages(spoken, fromMs, toMs);
};

export const pageAt = (pages: PhrasePage[], nowMs: number): PhrasePage | null => {
  const live = pages.find((page) => nowMs >= page.appearMs && nowMs < page.hideMs);
  return live ?? null;
};
