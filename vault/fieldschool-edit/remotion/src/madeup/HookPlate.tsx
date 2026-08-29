import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {interpolate, spring, useDelayRender, useVideoConfig} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {displayFace, gold, ink} from "./tokens";

type HookPlateProps = {
  text: string;
  local: number;
  ghost?: number;
  pip?: boolean;
};

const LINES: Record<string, string[]> = {
  "PEOPLE WAIT TO BE TOLD": ["PEOPLE", "WAIT TO", "BE TOLD"],
  "YOU CAN JUST DO THINGS": ["YOU CAN", "JUST DO", "THINGS"],
};

export const HookPlate: React.FC<HookPlateProps> = ({text, local, ghost = 0, pip = false}) => {
  const {fps} = useVideoConfig();
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender("hook-fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    waitMadeUpFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [continueRender, handle]);
  const lines = LINES[text] || text.split(" ").reduce<string[]>((acc, word, i, all) => {
    if (i % 2 === 0) {
      acc.push(all.slice(i, i + 2).join(" "));
    }
    return acc;
  }, []);
  const width = pip ? 1320 : 1760;
  const sizes = useMemo(() => {
    if (!ready) {
      return lines.map(() => (pip ? 92 : 184));
    }
    return lines.map((line, i) => {
      const cap = pip ? (i === 1 ? 112 : 104) : i === 1 ? 164 : 196;
      try {
        return Math.min(
          cap,
          fitText({
            text: line,
            withinWidth: width,
            fontFamily: displayFace,
            fontWeight: "700",
          }).fontSize,
        );
      } catch {
        return cap;
      }
    });
  }, [lines, pip, ready, width]);
  if (!ready) {
    return null;
  }
  const grow = interpolate(local, [0, 24, 170], [0.94, 1.02, 1.08], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const pulse = interpolate(local, [40, 52, 70], [1, 1.05, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const exit = interpolate(ghost, [0, 1], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        left: pip ? 64 : 80,
        top: 0,
        width,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: pip ? "flex-start" : "center",
        textAlign: pip ? "left" : "center",
        opacity: exit,
        scale: `${grow * (pip ? 1 : pulse)}`,
        translate: `0px ${interpolate(ghost, [0, 1], [0, -40], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px`,
      }}
    >
      {lines.map((line, i) => {
        const enter = spring({
          frame: Math.max(0, local - i * 2),
          fps,
          durationInFrames: 12,
          config: {damping: 8, mass: 0.38, stiffness: 280},
        });
        const rule = spring({
          frame: Math.max(0, local - 4 - i * 2),
          fps,
          durationInFrames: 10,
          config: {damping: 14, mass: 0.4, stiffness: 220},
        });
        return (
          <div key={line} style={{marginBottom: 6}}>
            <div
              style={{
                fontFamily: displayFace,
                fontWeight: 700,
                fontSize: sizes[i],
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: i === 1 ? gold : ink,
                opacity: enter,
                translate: `0px ${(1 - enter) * 96}px`,
                scale: `${0.72 + enter * 0.28}`,
              }}
            >
              {line}
            </div>
            {i === 1 ? (
              <div
                style={{
                  width: pip ? 420 : 640,
                  height: 5,
                  marginTop: 8,
                  marginLeft: pip ? 0 : "auto",
                  marginRight: pip ? 0 : "auto",
                  backgroundColor: gold,
                  scale: `${rule} 1`,
                  opacity: rule,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
