export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
};

export type Overlay = {
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type OpenerProps = {
  kicker: string;
  title: string;
  claim: string;
  durationSec: number;
  overlay: Overlay;
  captions: Caption[];
};

export type RecapProps = {
  kicker: string;
  title: string;
  points: string[];
  durationSec: number;
  overlay: Overlay;
  captions: Caption[];
};

export type DefinitionProps = {
  term: string;
  definition: string;
  durationSec: number;
  overlay: Overlay;
  captions: Caption[];
};

export type QuizBumperProps = {
  prompt: string;
  sourceUnitTitle: string;
  sourceUnitId: string;
  durationSec: number;
  overlay: Overlay;
  captions: Caption[];
};

export type TalkingHeadProps = {
  name: string;
  role: string;
  line: string;
  dock: "dock-right" | "dock-left";
  durationSec: number;
  overlay: Overlay;
  captions: Caption[];
};

/** Fixture lesson spine: sting → slate → objective → recap → next-up. */
export type LessonSpineProps = {
  sting: OpenerProps;
  slate: TalkingHeadProps;
  objective: DefinitionProps;
  recap: RecapProps;
  nextUp: QuizBumperProps;
};
