import React from "react";
import {Audio} from "@remotion/media";
import {Sequence, staticFile, useVideoConfig} from "remotion";
import type {LessonCue} from "../../schema/episode";

/** Bed at 0.12. Sting, whoosh, tick, hit. Volumes stay constant — no VO duck. */
export const LessonAudio: React.FC<{
  musicVolume: number;
  cues: LessonCue[];
  stingMs: number[];
  whooshMs: number[];
}> = ({musicVolume, cues, stingMs, whooshMs}) => {
  const {fps, durationInFrames} = useVideoConfig();
  return (
    <>
      <Audio
        src={staticFile("lesson60/bed.mp3")}
        volume={musicVolume}
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
          <Audio src={staticFile("lesson60/whoosh.wav")} volume={0.32} premountFor={fps} />
        </Sequence>
      ))}
      {cues.map((cue) => {
        if (cue.sfx === "none") {
          return null;
        }
        const from = Math.max(0, Math.round((cue.fromMs / 1000) * fps));
        if (from >= durationInFrames) {
          return null;
        }
        const src = cue.sfx === "hit" ? "lesson60/ding.wav" : "lesson60/switch.wav";
        return (
          <Sequence key={cue.id} from={from} durationInFrames={Math.round(1.2 * fps)}>
            <Audio src={staticFile(src)} volume={cue.sfx === "hit" ? 0.3 : 0.22} premountFor={fps} />
          </Sequence>
        );
      })}
    </>
  );
};
