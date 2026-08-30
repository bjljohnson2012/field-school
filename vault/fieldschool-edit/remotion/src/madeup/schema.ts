export type ShotType = "sting" | "hook" | "a-roll" | "b-roll" | "vox" | "cta";
export type ShotLayout = "off" | "dock-right" | "dock-left" | "pip-tr" | "letterbox";

export type MadePhrase = {
  text: string;
  fromMs: number;
};

export type MadeShot = {
  id: string;
  type: ShotType;
  fromFrame: number;
  durationInFrames: number;
  layout: ShotLayout;
  text?: string;
  plate?: string;
  phrases?: MadePhrase[];
  assets?: string[];
  sfx?: string[];
  annotation?: string;
  chips?: string[];
  list?: string[];
  lowerThird?: {name: string; title: string};
};

export type MadeWord = {
  text: string;
  fromMs: number;
  toMs: number;
};

export type MadeEpisode = {
  slug: string;
  title: string;
  cam: string;
  vo: string;
  captions: string;
  shots: MadeShot[];
  words?: MadeWord[];
};
