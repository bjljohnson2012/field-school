import React from "react";
import {Video} from "@remotion/media";
import {colorCorrection} from "@remotion/effects/color-correction";
import {Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

const SRC_W = 1920;
const SRC_H = 1080;
/** Face window on the Cap frame. Eyes sit one third of the way down the crop. */
const CROP = {x: 628, y: 5, w: 864, h: 900};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * Full-frame face. One zoom curve from 1.00 to zoomCap across this sequence.
 * The curve does not reset.
 */
export const TalkingHead: React.FC<{
  trimBefore: number;
  zoomCap: number;
  durationInFrames: number;
  temperature: number;
}> = ({trimBefore, zoomCap, durationInFrames, temperature}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const cap = Math.min(1.12, zoomCap);
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1, cap], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const fit = width / CROP.w;
  const eye = CROP.y + CROP.h / 3;
  const left = -CROP.x * fit;
  const top = height / 3 - eye * fit;
  const originX = ((CROP.x + CROP.w / 2) / SRC_W) * 100;
  const originY = (eye / SRC_H) * 100;

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#0b1f3a"}}>
      <Video
        src={staticFile("lesson60/aroll-clean.mp4")}
        trimBefore={trimBefore}
        muted
        premountFor={fps}
        style={{
          position: "absolute",
          width: SRC_W * fit,
          height: SRC_H * fit,
          left,
          top,
          scale,
          transformOrigin: `${originX}% ${originY}%`,
        }}
        effects={[
          colorCorrection({
            exposure: 0.06,
            contrast: 1.08,
            shadows: 0.04,
            highlights: -0.1,
            temperature,
            saturation: 0.84,
            vibrance: -0.06,
          }),
        ]}
      />
    </div>
  );
};
