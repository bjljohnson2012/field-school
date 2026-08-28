import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {INTRO_FRAMES, displayFace, ink, sansFace, stone} from "../../brand/tokens";

type LockupIntroProps = {
  course: string;
  module: string;
  title: string;
};

export const LockupIntro: React.FC<LockupIntroProps> = ({course, module, title}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const hold = Math.min(INTRO_FRAMES, durationInFrames);
  const fadeIn = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: "clamp"});
  const fadeOut = interpolate(frame, [hold - 18, hold], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const opacity = Math.min(fadeIn, fadeOut);
  return (
    <div style={{position: "absolute", inset: 0, opacity}}>
      <Img
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{position: "absolute", left: 360, top: 280, width: 1200, height: 220, objectFit: "contain"}}
      />
      <div
        style={{
          position: "absolute",
          left: 360,
          top: 540,
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: stone,
        }}
      >
        {course} · {module}
      </div>
      <div
        style={{
          position: "absolute",
          left: 360,
          top: 580,
          width: 1200,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 56,
          letterSpacing: "-0.03em",
          color: ink,
        }}
      >
        {title}
      </div>
    </div>
  );
};
