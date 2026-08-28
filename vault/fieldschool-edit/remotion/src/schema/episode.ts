export type CaptionWord = {
  text: string;
  fromMs: number;
  toMs: number;
};

export type CaptionPage = {
  startMs: number;
  endMs: number;
  words: CaptionWord[];
};

export type CueKind = "vox" | "hit" | "whoosh";

export type KeywordCue = {
  word: string;
  fromMs: number;
  kind: CueKind;
};

export type Episode = {
  course: string;
  module: string;
  title: string;
  objective: string;
  src: string;
  durationSec: number;
  captions: CaptionPage[];
  cues: KeywordCue[];
};
