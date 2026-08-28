export type Cut = {in: number; out: number};

export type Overlay = {
  logo: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
};

export type TitleCard = {at: number; text: string; draft?: boolean; card?: string};

export type SceneMotion = "spring" | "interpolate";

export type Scene = {
  id: string;
  label: string;
  in: number;
  out: number;
  x: number;
  y: number;
  scale: number;
  motion: SceneMotion;
  text: string;
  card?: string;
};

export type WordStamp = {
  text: string;
  start: number;
  end: number;
};

export type Phrase = {
  start: number;
  end: number;
  words: WordStamp[];
};

export type Props = {
  src: string;
  cuts: Cut[];
  overlay: Overlay;
  titleCards: TitleCard[];
  scenes: Scene[];
  durationSec: number;
  phrases?: Phrase[];
  introSec?: number;
  lessonTitle?: string;
};

export const defaultProps: Props = {
  src: "a_roll.mp4",
  cuts: [{in: 0, out: 8}],
  overlay: {
    logo: "isolated-seal.png",
    x: 48,
    y: 36,
    w: 72,
    h: 72,
    title: "You Can Just Do Things",
  },
  titleCards: [],
  scenes: [],
  durationSec: 8,
  phrases: [],
  introSec: 7.5,
  lessonTitle: "You Can Just Do Things",
};
