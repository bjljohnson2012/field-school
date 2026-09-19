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

export type SceneMotion = "spring" | "interpolate" | "glide" | "takeover";

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
  src: "fixture",
  cuts: [{in: 0, out: 8}],
  overlay: {
    logo: "isolated-seal.svg",
    x: 1576,
    y: 24,
    w: 80,
    h: 64,
    title: "SceneMotion fixture",
  },
  titleCards: [],
  scenes: [
    {
      id: "takeover-open",
      label: "Takeover",
      in: 0,
      out: 4,
      x: 72,
      y: 160,
      scale: 1,
      motion: "takeover",
      text: "Card owns the open. Then the head eases in from the right.",
    },
    {
      id: "glide-enter",
      label: "Glide",
      in: 4,
      out: 8,
      x: 72,
      y: 160,
      scale: 1,
      motion: "glide",
      text: "Type walks in from the left. Soft opacity. No bounce.",
    },
  ],
  durationSec: 8,
  phrases: [],
  introSec: 0,
  lessonTitle: "SceneMotion fixture",
};

export const SCENE_MOTIONS: SceneMotion[] = ["spring", "interpolate", "glide", "takeover"];
