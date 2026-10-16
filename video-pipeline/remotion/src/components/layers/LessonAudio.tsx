import React from "react";
import {Audio} from "@remotion/media";
import type {Caption} from "@remotion/captions";
import {interpolate, Sequence, staticFile, useVideoConfig} from "remotion";
import type {LessonProps} from "../../schema/lessonProps";
import {OUTRO_FRAMES, SCENE_START} from "../../lesson/timeline";

const WHOOSH = "lesson60/sfx-whoosh.wav";
const DING = "lesson60/sfx-ding.wav";
const SWITCH = "lesson60/sfx-switch.wav";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function endFade(frame: number, duration: number, fadeFrames: number): number {
  return interpolate(frame, [duration - fadeFrames, duration - 1], [1, 0], clamp);
}

function speechGain(frame: number, fps: number, captions: Caption[], open: number, duck: number): number {
  const ms = (frame / fps) * 1000;
  let gain = open;
  for (const caption of captions) {
    const attackStart = caption.startMs - 150;
    const releaseEnd = caption.endMs + 400;
    if (ms < attackStart || ms > releaseEnd) {
      continue;
    }
    if (ms < caption.startMs) {
      const t = (ms - attackStart) / 150;
      gain = Math.min(gain, open + (duck - open) * t);
    } else if (ms > caption.endMs) {
      const t = (ms - caption.endMs) / 400;
      gain = Math.min(gain, duck + (open - duck) * t);
    } else {
      gain = Math.min(gain, duck);
    }
  }
  return gain;
}

function underSpeech(captions: Caption[], startMs: number, durMs: number): boolean {
  const end = startMs + durMs;
  return captions.some((caption) => caption.endMs > startMs && caption.startMs < end);
}

/** Suno bed under speech, Suno sting on the intro and outro, Remotion SFX on the cuts. */
export const LessonAudio: React.FC<{
  props: LessonProps;
  captions: Caption[];
  pillMs: number[];
}> = ({props, captions, pillMs}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const transitions = [SCENE_START.cam, SCENE_START.teach, SCENE_START.show, SCENE_START.do, SCENE_START.outro];
  const tail = endFade(durationInFrames - 1, durationInFrames, props.fadeOutFrames);

  return (
    <>
      <Audio
        src={staticFile(props.musicSting)}
        premountFor={fps}
        trimAfter={Math.round(3.2 * fps)}
        volume={(frame) => {
          const inn = interpolate(frame, [0, 8], [0, 0.46], clamp);
          const out = interpolate(frame, [50, 90], [1, 0], clamp);
          return inn * out * endFade(frame, durationInFrames, props.fadeOutFrames);
        }}
      />
      <Audio
        src={staticFile(props.musicBed)}
        premountFor={fps}
        volume={(frame) => {
          const inn = interpolate(frame, [SCENE_START.cam - 8, SCENE_START.cam + 20], [0, 1], clamp);
          const out = interpolate(frame, [SCENE_START.outro - 12, SCENE_START.outro + 18], [1, 0], clamp);
          const duck = speechGain(frame, fps, captions, props.bedOpen, props.bedDuck);
          return inn * out * duck * endFade(frame, durationInFrames, props.fadeOutFrames);
        }}
      />
      <Sequence from={SCENE_START.outro} durationInFrames={OUTRO_FRAMES} premountFor={fps}>
        <Audio
          src={staticFile(props.musicSting)}
          premountFor={fps}
          volume={(frame) => {
            const inn = interpolate(frame, [0, 12], [0, 0.42], clamp);
            const out = interpolate(frame, [OUTRO_FRAMES - props.fadeOutFrames, OUTRO_FRAMES - 1], [1, 0], clamp);
            return inn * out;
          }}
        />
      </Sequence>
      <Audio src={staticFile("lesson60/vo.wav")} premountFor={fps} volume={1} />
      {transitions.map((start) => {
        const ms = (start / fps) * 1000;
        const quiet = underSpeech(captions, ms, 500);
        return (
          <Sequence key={`whoosh-${start}`} from={start} durationInFrames={24} premountFor={fps}>
            <Audio src={staticFile(WHOOSH)} premountFor={fps} volume={quiet ? 0.02 : 0.12 * (start > durationInFrames - props.fadeOutFrames ? tail : 1)} />
          </Sequence>
        );
      })}
      {transitions.map((start) => {
        const ms = (start / fps) * 1000;
        const quiet = underSpeech(captions, ms, 450);
        return (
          <Sequence key={`ding-${start}`} from={start} durationInFrames={30} premountFor={fps}>
            <Audio src={staticFile(DING)} premountFor={fps} volume={quiet ? 0.015 : 0.1} />
          </Sequence>
        );
      })}
      {pillMs.map((ms) => {
        const start = Math.round((ms / 1000) * fps);
        const quiet = underSpeech(captions, ms, 280);
        return (
          <Sequence key={`switch-${ms}`} from={start} durationInFrames={18} premountFor={fps}>
            <Audio src={staticFile(SWITCH)} premountFor={fps} volume={quiet ? 0.012 : 0.07} />
          </Sequence>
        );
      })}
    </>
  );
};
