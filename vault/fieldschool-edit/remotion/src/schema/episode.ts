export type CaptionWord = {
  text: string;
  fromMs: number;
  toMs: number;
};

export type CueKind = "vox" | "hit" | "whoosh";

export type KeywordCue = {
  word: string;
  fromMs: number;
  kind: CueKind;
};

export type Silence = {
  afterMs: number;
  gapMs: number;
  cut: boolean;
  voxEnter: boolean;
};

export type RecapPlate = {
  kicker: string;
  text: string;
};

export type NextUp = {
  module: string;
  title: string;
};

export type Episode = {
  course: string;
  module: string;
  title: string;
  objective: string;
  hook: string;
  doPrompt: string;
  recap: [RecapPlate, RecapPlate, RecapPlate];
  nextUp: NextUp;
  showSrc: string;
  src: string;
  voSrc: string;
  durationSec: number;
  words: CaptionWord[];
  cues: KeywordCue[];
  silences: Silence[];
};
