import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {bg, gold, olive, paper} from "../../brand";

/** Charcoal field with a slow olive/gold drift. Frame-driven, no CSS animation. */
export const Bed: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const drift = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sway = Math.sin(frame / 42);
  const x = interpolate(drift, [0, 1], [-80, 120]) + sway * 36;
  const y = Math.cos(frame / 55) * 28;
  const scale = interpolate(drift, [0, 1], [1, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{backgroundColor: bg, overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          left: 180 + x,
          top: 120 + y,
          width: 720,
          height: 720,
          borderRadius: 360,
          backgroundColor: olive,
          opacity: 0.55,
          scale,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 80 - sway * 24,
          bottom: -120 + y,
          width: 640,
          height: 640,
          borderRadius: 320,
          backgroundColor: paper,
          opacity: 0.06,
          scale: 1.1 - drift * 0.08,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 120 + sway * 80,
          top: 860 + Math.sin(frame / 70) * 24,
          width: 980,
          height: 2,
          backgroundColor: gold,
          opacity: 0.28,
        }}
      />
    </AbsoluteFill>
  );
};
