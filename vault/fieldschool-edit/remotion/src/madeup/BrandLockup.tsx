import React from "react";
import {Img, interpolate, spring, staticFile, useVideoConfig} from "remotion";
import {displayFace, gold, ink} from "./tokens";

type BrandLockupProps = {
  local: number;
  title?: string;
};

export const BrandLockup: React.FC<BrandLockupProps> = ({local, title = "Everything Is Made Up"}) => {
  const {fps} = useVideoConfig();
  const stamp = spring({
    frame: local,
    fps,
    durationInFrames: 22,
    config: {damping: 11, mass: 0.55, stiffness: 190},
  });
  const typeIn = spring({
    frame: local - 10,
    fps,
    durationInFrames: 20,
    config: {damping: 13, mass: 0.6, stiffness: 170},
  });
  const grow = interpolate(local, [12, 140], [0.86, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const leave = interpolate(local, [130, 154], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
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
        opacity: stamp * leave,
      }}
    >
      <Img
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{
          width: 1180,
          height: 210,
          objectFit: "contain",
          objectPosition: "center",
          scale: `${interpolate(stamp, [0, 1], [1.22, 1])}`,
        }}
      />
      <div
        style={{
          width: 168,
          height: 3,
          marginTop: 32,
          backgroundColor: gold,
          scale: `${typeIn} 1`,
          opacity: typeIn,
        }}
      />
      <div
        style={{
          marginTop: 22,
          width: 1500,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 64,
          letterSpacing: "-0.035em",
          color: ink,
          opacity: typeIn,
          scale: `${grow}`,
          translate: `0px ${(1 - typeIn) * 20}px`,
        }}
      >
        {title}
      </div>
    </div>
  );
};

export const BrandBug: React.FC<{open: number}> = ({open}) => {
  if (open <= 0) {
    return null;
  }
  return (
    <Img
      src={staticFile("isolated-seal.png")}
      style={{
        position: "absolute",
        right: 36,
        bottom: 28,
        width: 72,
        height: 72,
        objectFit: "contain",
        opacity: 0.42 * open,
      }}
    />
  );
};
