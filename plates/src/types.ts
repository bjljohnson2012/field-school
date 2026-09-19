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
