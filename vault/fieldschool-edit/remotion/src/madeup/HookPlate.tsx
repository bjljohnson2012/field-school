import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {interpolate, spring, useDelayRender, useVideoConfig} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {displayFace, gold, paper} from "./tokens";

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
      return lines.map(() => (pip ? 92 : 176));
    }
    return lines.map((line, i) => {
      const cap = pip ? (i === 1 ? 108 : 100) : i === 1 ? 156 : 188;
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
  const grow = interpolate(local, [0, 90], [0.92, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
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
        opacity: interpolate(ghost, [0, 1], [1, 0.1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        scale: `${grow}`,
      }}
    >
      {lines.map((line, i) => {
        const enter = spring({
          frame: Math.max(0, local - i * 5),
          fps,
          durationInFrames: 18,
          config: {damping: 14, mass: 0.55, stiffness: 160},
        });
        return (
          <div
            key={line}
            style={{
              fontFamily: displayFace,
              fontWeight: 700,
              fontSize: sizes[i],
              lineHeight: 0.92,
              letterSpacing: "-0.045em",
              color: i === 1 ? gold : paper,
              opacity: enter,
              translate: `0px ${(1 - enter) * 48}px`,
              marginBottom: 8,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};
