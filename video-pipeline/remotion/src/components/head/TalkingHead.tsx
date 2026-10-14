import React from "react";
import {Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Video} from "@remotion/media";
import episodeJson from "../../lesson/episode.json";
import type {Episode, LessonCue} from "../../schema/episode";
import {takeoverHead} from "../../sceneMotionMath";

const episode = episodeJson as Episode;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** Docked A-roll. Scale and translate ease on emphasis beats — not a static crop. */
export const TalkingHead: React.FC<{
  offsetFrames: number;
  cues: LessonCue[];
}> = ({offsetFrames, cues}) => {
  const local = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const compositionFrame = local + offsetFrames;
  const sec = compositionFrame / fps;
  const chapter =
    episode.chapters.find((item) => sec >= item.inSec && sec < item.outSec) ??
    episode.chapters[episode.chapters.length - 1];
  const enter = takeoverHead(local).opacity;
  const into = compositionFrame - chapter.inSec * fps;
  const leave = chapter.showHead ? 1 : interpolate(into, [0, 10], [1, 0], clamp);
  const opacity = enter * leave;

  const drift = interpolate(local, [0, 1200], [0, 1], clamp);
  const baseScale = interpolate(drift, [0, 1], [1.04, 1.1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const baseX = interpolate(drift, [0, 1], [0, -36], clamp);
  const baseY = interpolate(drift, [0, 1], [8, -20], clamp);

  let push = 0;
  for (const cue of cues) {
    if (!cue.emphasis) {
      continue;
    }
    const cueFrame = Math.round((cue.fromMs / 1000) * fps);
    const at = compositionFrame - cueFrame;
    if (at < 0 || at > 36) {
      continue;
    }
    const attack = spring({
      frame: at,
      fps,
      config: {damping: 200, mass: 0.8},
      durationInFrames: 12,
    });
    const release = interpolate(at, [14, 34], [1, 0], {
      ...clamp,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    push = Math.max(push, attack * release);
  }

  const dockW = Math.round(width * episode.dockWidth);
  const dockH = 840;
  const videoH = dockH;
  const videoW = Math.round(videoH * (16 / 9));

  return (
    <div
      style={{
        position: "absolute",
        left: width - dockW - 48,
        top: 112,
        width: dockW,
        height: dockH,
        overflow: "hidden",
        borderRadius: 22,
        opacity,
      }}
    >
      <Video
        src={staticFile("lesson60/aroll.mp4")}
        premountFor={fps}
        volume={1}
        style={{
          position: "absolute",
          width: videoW,
          height: videoH,
          left: 0,
          top: 0,
          scale: baseScale + push * 0.18,
          translate: `${baseX + push * -56}px ${baseY + push * -40}px`,
          transformOrigin: "24% 16%",
        }}
      />
    </div>
  );
};
