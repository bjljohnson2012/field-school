import React from "react";
import {Video} from "@remotion/media";
import {colorCorrection} from "@remotion/effects/color-correction";
import {CameraMotionBlur} from "@remotion/motion-blur";
import {Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, navy, orange, paper, sansFace} from "../../brand";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const Line: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 14], [28, 0], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        translate: `0px ${shift}px`,
        opacity: interpolate(frame, [0, 8], [0, 1], clamp),
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: 78,
        letterSpacing: "-0.03em",
        lineHeight: 1.05,
        color: paper,
        maxWidth: 1400,
      }}
    >
      {text}
    </div>
  );
};

/** Teach and show. Pexels picture under a navy scrim and a big line. */
export const BrollCard: React.FC<{
  src: string;
  kicker: string;
  text: string;
  temperature: number;
}> = ({src, kicker, text, temperature}) => {
  const {fps, width, height} = useVideoConfig();
  return (
    <div style={{width, height, backgroundColor: navy, position: "absolute", inset: 0}}>
      <Video
        src={staticFile(src)}
        muted
        premountFor={fps}
        objectFit="cover"
        style={{width: "100%", height: "100%"}}
        effects={[
          colorCorrection({
            temperature,
            contrast: 1.06,
            saturation: 0.82,
            highlights: -0.08,
          }),
        ]}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${navy} 0%, rgba(11,31,58,0.78) 46%, rgba(11,31,58,0.28) 100%)`,
        }}
      />
      <div style={{position: "absolute", left: 96, top: 300, right: 120}}>
        <div
          style={{
            fontFamily: sansFace,
            fontWeight: 600,
            fontSize: 28,
            letterSpacing: "0.16em",
            color: orange,
            marginBottom: 24,
          }}
        >
          {kicker}
        </div>
        <CameraMotionBlur shutterAngle={120} samples={4}>
          <Line text={text} />
        </CameraMotionBlur>
      </div>
    </div>
  );
};
