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
  const fadeIn = interpolate(frame, [0, 16], [0, 1], {extrapolateRight: "clamp"});
  const fadeOut = interpolate(frame, [hold - 18, hold], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lockup = spring({
    frame,
    fps,
    durationInFrames: 22,
    config: {damping: 16, mass: 0.7},
  });
  const typeIn = spring({
    frame: frame - 14,
    fps,
    durationInFrames: 20,
    config: {damping: 14, mass: 0.55},
  });
  const rule = interpolate(typeIn, [0, 1], [0, 1], {extrapolateRight: "clamp"});
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
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <Img
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{
          width: 1100,
          height: 200,
          objectFit: "contain",
          objectPosition: "center",
          opacity: lockup,
          transform: `translateY(${(1 - lockup) * 18}px)`,
        }}
      />
      <div
        style={{
          width: 120,
          height: 2,
          marginTop: 36,
          backgroundColor: stone,
          transform: `scaleX(${rule})`,
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
          transform: `translateY(${(1 - typeIn) * 14}px)`,
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
          opacity: typeIn,
          transform: `translateY(${(1 - typeIn) * 14}px)`,
        }}
      >
        {title}
      </div>
    </div>
  );
};
