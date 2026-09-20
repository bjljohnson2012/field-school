import {gold, ink, stone} from "./brand";
import type {Caption} from "./types";

/** Fixture word clock. WhisperX ingest is a later stream. */
export type WordClockState = "unspoken" | "active" | "spoken";

export type ClockedWord = Caption & {state: WordClockState};

export const ACTIVE_WORD_GOLD = "#C4A35A";

export function wordState(word: Caption, nowMs: number): WordClockState {
  if (nowMs < word.startMs) return "unspoken";
  if (nowMs < word.endMs) return "active";
  return "spoken";
}

export function wordColor(state: WordClockState): string {
  if (state === "active") return gold;
  if (state === "spoken") return ink;
  return stone;
}

export function wordClock(captions: Caption[], nowMs: number) {
  const words: ClockedWord[] = captions.map((word) => ({
    ...word,
    state: wordState(word, nowMs),
  }));
  const activeIndex = words.findIndex((word) => word.state === "active");
  return {
    words,
    activeIndex,
    active: activeIndex >= 0 ? words[activeIndex] : null,
  };
}

export {gold as karaokeGold};
