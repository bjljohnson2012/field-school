import React from "react";
import {Video} from "@remotion/media";
import {colorCorrection} from "@remotion/effects/color-correction";
import {Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {navy} from "../../brand";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * Native 1920×1080 frame. One slow push, never past 1.05, so the head
 * and shoulders stay in frame and the picture is not upscaled soft.
 */
export const TalkingHead: React.FC<{
  trimBefore: number;
  zoomCap: number;
  durationInFrames: number;
  temperature: number;
}> = ({trimBefore, zoomCap, durationInFrames, temperature}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const cap = Math.min(1.04, zoomCap);
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1, cap], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", backgroundColor: navy}}>
      <Video
        src={staticFile("lesson60/aroll-clean.mp4")}
        trimBefore={trimBefore}
        muted
        objectFit="cover"
        premountFor={fps}
        style={{
          width,
          height,
          scale,
          transformOrigin: "50% 42%",
        }}
        effects={[
          colorCorrection({
            exposure: 0.04,
            contrast: 1.04,
            highlights: -0.06,
            temperature,
            saturation: 0.92,
          }),
        ]}
      />
    </div>
  );
};
