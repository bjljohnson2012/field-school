import React from "react";
import {Audio} from "@remotion/media";
import type {Caption} from "@remotion/captions";
import {Sequence, staticFile, useVideoConfig} from "remotion";
import type {Episode, LessonCue} from "../../schema/episode";

const OPEN = 0.12;
const DUCK = OPEN * 10 ** (-6 / 20);
const SFX = 10 ** (-24 / 20);
const ATTACK_SEC = 0.15;
const RELEASE_SEC = 0.4;

function isOpen(mode: string): boolean {
  return mode === "sting" || mode === "slate" || mode === "next";
}

/** 0.12 on sting, slate, and outro. Another −6 dB under speech, with a 150 ms attack and 400 ms release. */
function bedVolume(frame: number, fps: number, episode: Episode): number {
  const sec = frame / fps;
  const index = episode.chapters.findIndex((item) => sec >= item.inSec && sec < item.outSec);
  const cursor = index === -1 ? episode.chapters.length - 1 : index;
  const chapter = episode.chapters[cursor];
  const previous = cursor > 0 ? episode.chapters[cursor - 1] : undefined;
  const into = sec - chapter.inSec;
  if (isOpen(chapter.mode)) {
    if (previous && !isOpen(previous.mode)) {
      const t = Math.min(1, Math.max(0, into / RELEASE_SEC));
      return DUCK + (OPEN - DUCK) * t;
    }
    return OPEN;
  }
  if (previous && isOpen(previous.mode)) {
    const t = Math.min(1, Math.max(0, into / ATTACK_SEC));
    return OPEN + (DUCK - OPEN) * t;
  }
  return DUCK;
}

function underSpeech(captions: Caption[], startMs: number, durMs: number): boolean {
  const end = startMs + durMs;
  return captions.some((caption) => caption.endMs > startMs && caption.startMs < end);
}

/** Whoosh on card takeovers and a tick on pill entries, both at −24 dB, and silent while a word is active. */
export const LessonAudio: React.FC<{
  episode: Episode;
  captions: Caption[];
  cues: LessonCue[];
  stingMs: number[];
  whooshMs: number[];
}> = ({episode, captions, cues, stingMs, whooshMs}) => {
  const {fps, durationInFrames} = useVideoConfig();
  return (
    <>
      <Audio
        src={staticFile("lesson60/bed.mp3")}
        volume={(frame) => bedVolume(frame, fps, episode)}
        loop
        premountFor={fps}
      />
      {stingMs.map((ms) => (
        <Sequence
          key={`sting-${ms}`}
          from={Math.max(0, Math.round((ms / 1000) * fps))}
          durationInFrames={Math.round(1.1 * fps)}
        >
          <Audio src={staticFile("lesson60/sting.wav")} volume={0.42} premountFor={fps} />
        </Sequence>
      ))}
      {whooshMs.map((ms) => (
        <Sequence
          key={`whoosh-${ms}`}
          from={Math.max(0, Math.round((ms / 1000) * fps))}
          durationInFrames={Math.round(0.6 * fps)}
        >
          <Audio
            src={staticFile("lesson60/whoosh.wav")}
            volume={underSpeech(captions, ms, 600) ? 0 : SFX}
            premountFor={fps}
          />
        </Sequence>
      ))}
      {cues.map((cue) => {
        if (!cue.vox) {
          return null;
        }
        const from = Math.max(0, Math.round((cue.fromMs / 1000) * fps));
        if (from >= durationInFrames) {
          return null;
        }
        return (
          <Sequence key={cue.id} from={from} durationInFrames={Math.round(0.45 * fps)}>
            <Audio
              src={staticFile("lesson60/switch.wav")}
              volume={underSpeech(captions, cue.fromMs, 450) ? 0 : SFX}
              premountFor={fps}
            />
          </Sequence>
        );
      })}
    </>
  );
};
