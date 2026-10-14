export type LessonCue = {
  id: string;
  text: string;
  fromMs: number;
  sfx: "tick" | "hit" | "none";
  emphasis: boolean;
  vox: boolean;
};

export type LessonChapter = {
  id: string;
  kicker: string;
  text: string;
  inSec: number;
  outSec: number;
  motion: "glide" | "takeover";
  showHead: boolean;
  letterbox: number;
  mode: "sting" | "slate" | "objective" | "card" | "show" | "recap" | "next";
};

export type Episode = {
  id: string;
  fps: number;
  width: number;
  height: number;
  durationSec: number;
  durationFrames: number;
  voOffsetSec: number;
  speechSec: number;
  course: string;
  module: string;
  title: string;
  objective: string;
  lowerThird: {name: string; org: string};
  music: {
    title: string;
    artist: string;
    url: string;
    license: string;
    licenseUrl: string;
    volume: number;
  };
  silenceRuleMs: number;
  lufsTarget: number;
  dockWidth: number;
  chapters: LessonChapter[];
  cues: LessonCue[];
  voxEnterMs: number[];
  stingMs: number[];
  whooshMs: number[];
  stills: {id: string; frame: number}[];
};
