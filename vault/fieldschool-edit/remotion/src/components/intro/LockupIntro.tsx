import React from "react";
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {INTRO_FRAMES, displayFace, ink, sansFace, stone} from "../../brand/tokens";

type LockupIntroProps = {
  course: string;
  module: string;
  title: string;
};

export const LockupIntro: React.FC<LockupIntroProps> = ({course, module, title}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const hold = Math.min(INTRO_FRAMES, durationInFrames);
  const stamp = spring({
    frame,
    fps,
    durationInFrames: 16,
    config: {damping: 11, mass: 0.42, stiffness: 190},
  });
  const typeIn = spring({
    frame: frame - 12,
    fps,
    durationInFrames: 18,
    config: {damping: 13, mass: 0.5},
  });
  const rule = interpolate(typeIn, [0, 1], [0, 1], {extrapolateRight: "clamp"});
  const fadeOut = interpolate(frame, [hold - 14, hold], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [hold - 14, hold], [1, 0.97], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: fadeOut,
        transform: `scale(${exit})`,
      }}
    >
      <Img
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{
          width: 1100,
          height: 200,
          objectFit: "contain",
          objectPosition: "center",
          opacity: stamp,
          transform: `scale(${interpolate(stamp, [0, 1], [1.16, 1])})`,
        }}
      />
      <div
        style={{
          width: 168,
          height: 2,
          marginTop: 36,
          backgroundColor: stone,
          transform: `scaleX(${rule})`,
          transformOrigin: "center",
          opacity: typeIn,
        }}
      />
      <div
        style={{
          marginTop: 28,
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: stone,
          opacity: typeIn,
          transform: `translateY(${(1 - typeIn) * 12}px)`,
        }}
      >
        {course} · {module}
      </div>
      <div
        style={{
          marginTop: 12,
          width: 1400,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 56,
          letterSpacing: "-0.03em",
          color: ink,
          opacity: interpolate(frame, [20, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `scale(${interpolate(frame, [22, 168], [0.78, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          transformOrigin: "center",
        }}
      >
        {title}
      </div>
    </div>
  );
};
