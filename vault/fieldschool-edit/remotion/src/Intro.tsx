import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {blue, cream, displayFace, ink, sansFace, stone, tagline} from "./brand";

export const Intro: React.FC<{title: string}> = ({title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seal = spring({frame, fps, config: {damping: 14, mass: 0.7}});
  const lockup = spring({frame: frame - 28, fps, config: {damping: 16, mass: 0.6}});
  const titleIn = spring({frame: frame - 70, fps, config: {damping: 13, mass: 0.5}});
  const line = interpolate(frame, [100, 150], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const wipe = interpolate(frame, [195, 225], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 18,
          height: 1080,
          backgroundColor: blue,
          transform: `scaleY(${interpolate(frame, [0, 18], [0, 1], {extrapolateRight: "clamp"})})`,
          transformOrigin: "top",
        }}
      />
      <Img
        src={staticFile("isolated-seal.png")}
        style={{
          position: "absolute",
          left: 820,
          top: 160,
          width: 280,
          height: 280,
          objectFit: "contain",
          opacity: interpolate(seal, [0, 1], [0, 1]),
          transform: `scale(${0.72 + 0.28 * seal})`,
        }}
      />
      <Img
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{
          position: "absolute",
          left: 560,
          top: 460,
          width: 800,
          height: 160,
          objectFit: "contain",
          opacity: interpolate(lockup, [0, 1], [0, 1]),
          transform: `translateY(${(1 - lockup) * 18}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 680,
          width: 1600,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 72,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: ink,
          textAlign: "center",
          opacity: interpolate(titleIn, [0, 1], [0, 1]),
          transform: `translateY(${(1 - titleIn) * 24}px)`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 780,
          width: 800,
          height: 4,
          backgroundColor: blue,
          transform: `scaleX(${line})`,
          transformOrigin: "center",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 810,
          width: 1600,
          fontFamily: sansFace,
          fontSize: 26,
          letterSpacing: "0.04em",
          color: stone,
          textAlign: "center",
          opacity: line,
        }}
      >
        {tagline}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920 * wipe,
          height: 1080,
          backgroundColor: blue,
        }}
      />
    </AbsoluteFill>
  );
};
