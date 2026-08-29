import React from "react";
import {Img, interpolate, spring, staticFile, useVideoConfig} from "remotion";
import {displayFace, gold, ink, uiFace} from "./tokens";

type BrandLockupProps = {
  local: number;
  title?: string;
};

const SLOGAN = "Lead yourself. Learn yourself. Do the work.";

export const BrandLockup: React.FC<BrandLockupProps> = ({local, title = "Everything Is Made Up"}) => {
  const {fps} = useVideoConfig();
  const stamp = spring({
    frame: local,
    fps,
    durationInFrames: 16,
    config: {damping: 9, mass: 0.42, stiffness: 240},
  });
  const typeIn = spring({
    frame: local - 10,
    fps,
    durationInFrames: 18,
    config: {damping: 12, mass: 0.55, stiffness: 190},
  });
  const grow = interpolate(local, [16, 132], [0.92, 1.05], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const leave = interpolate(local, [146, 152], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const shove = interpolate(local, [146, 152], [0, -140], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
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
        opacity: leave,
        translate: `0px ${shove}px`,
      }}
    >
      <Img
        src={staticFile("wordmark-transparent.png")}
        style={{
          width: 1180,
          height: 220,
          objectFit: "contain",
          objectPosition: "center",
          opacity: stamp,
          scale: `${interpolate(stamp, [0, 1], [1.28, 1])}`,
          rotate: `${interpolate(stamp, [0, 1], [-4, 0])}deg`,
        }}
      />
      <div
        style={{
          marginTop: 16,
          fontFamily: uiFace,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: "0.08em",
          color: ink,
          opacity: typeIn * 0.74,
        }}
      >
        {SLOGAN}
      </div>
      <div
        style={{
          width: 220,
          height: 4,
          marginTop: 26,
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
          fontSize: 68,
          letterSpacing: "-0.04em",
          color: ink,
          opacity: typeIn,
          scale: `${grow}`,
          translate: `0px ${(1 - typeIn) * 36}px`,
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
        width: 76,
        height: 76,
        objectFit: "contain",
        opacity: 0.5 * open,
      }}
    />
  );
};
