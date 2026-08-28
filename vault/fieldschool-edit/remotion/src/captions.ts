import type {Caption} from "@remotion/captions";
import type {CaptionWord} from "./schema/episode";

export const wordsToCaptions = (words: CaptionWord[]): Caption[] => {
  return words.map((word, i) => {
    const text = i === 0 ? word.text : ` ${word.text}`;
    return {
      text,
      startMs: word.fromMs,
      endMs: word.toMs,
      timestampMs: word.fromMs,
      confidence: null,
    };
  });
};
