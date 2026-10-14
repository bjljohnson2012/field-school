import React from "react";
import {Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Video} from "@remotion/media";
import {bg} from "../../brand";
import episodeJson from "../../lesson/episode.json";
import type {Episode} from "../../schema/episode";
import {TAKEOVER_HOLD_FRAMES, takeoverHead} from "../../sceneMotionMath";

const episode = episodeJson as Episode;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const SRC_W = 1920;
const SRC_H = 1080;
/** Face window on the Cap frame. Width is 0.45 of the source. Eyes sit at 1/3 of the crop. */
const CROP = {x: 628, y: 5, w: 864, h: 900};
const PUSH = Easing.bezier(0.33, 0, 0.2, 1);

/** 1.00 → 1.08 inside a beat. A return to 1.00 happens only while a takeover covers the head. */
function pushScale(frame: number, fps: number): number {
  const sec = frame / fps;
  let carried = 1;
  let prevShow = false;
  for (const chapter of episode.chapters) {
    const span = Math.max(1 / fps, chapter.outSec - chapter.inSec);
    const localSec = Math.min(Math.max(0, sec - chapter.inSec), span);
    const reset = chapter.motion === "takeover" || !prevShow;
    const from = reset ? 1 : carried;
    const hold = chapter.motion === "takeover" ? TAKEOVER_HOLD_FRAMES / fps : 0;
    const next =
      localSec <= hold
        ? from
        : interpolate(
            (localSec - hold) / Math.max(1 / fps, span - hold),
            [0, 1],
            [from, 1.08],
            {...clamp, easing: PUSH},
          );
    if (sec < chapter.outSec) {
      return next;
    }
    carried = next;
    prevShow = chapter.showHead;
  }
  return carried;
}

/** Docked A-roll, cropped onto the face. Scale eases; it does not jump. */
export const TalkingHead: React.FC<{offsetFrames: number}> = ({offsetFrames}) => {
  const local = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const compositionFrame = local + offsetFrames;
  const sec = compositionFrame / fps;
  const chapter =
    episode.chapters.find((item) => sec >= item.inSec && sec < item.outSec) ??
    episode.chapters[episode.chapters.length - 1];
  const chapterLocal = compositionFrame - chapter.inSec * fps;
  const covered = chapter.motion === "takeover" ? takeoverHead(chapterLocal).opacity : 1;
  const opacity = chapter.showHead ? covered : 0;
  const scale = pushScale(compositionFrame, fps);

  const innerW = Math.round(width * episode.dockWidth) - 16;
  const innerH = Math.round(innerW * (CROP.h / CROP.w));
  const dockW = innerW + 16;
  const dockH = innerH + 16;
  const fit = innerW / CROP.w;
  const originX = ((CROP.x + CROP.w / 2) / SRC_W) * 100;
  const originY = ((CROP.y + CROP.h / 3) / SRC_H) * 100;

  return (
    <div
      style={{
        position: "absolute",
        left: width - dockW - 48,
        top: 108,
        width: dockW,
        height: dockH,
        overflow: "hidden",
        borderRadius: 18,
        boxSizing: "border-box",
        border: `8px solid ${bg}`,
        opacity,
      }}
    >
      <Video
        src={staticFile("lesson60/aroll.mp4")}
        premountFor={fps}
        volume={1}
        style={{
          position: "absolute",
          width: SRC_W * fit,
          height: SRC_H * fit,
          left: -CROP.x * fit,
          top: -CROP.y * fit,
          scale,
          transformOrigin: `${originX}% ${originY}%`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: innerW,
          height: innerH,
          backgroundColor: bg,
          opacity: 0.18,
        }}
      />
    </div>
  );
};
