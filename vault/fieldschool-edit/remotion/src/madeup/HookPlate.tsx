import {fitText} from "@remotion/layout-utils";
import React, {useMemo} from "react";
import {interpolate} from "remotion";
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
  const lines = LINES[text] || text.split(" ").reduce<string[]>((acc, word, i, all) => {
    if (i % 2 === 0) {
      acc.push(all.slice(i, i + 2).join(" "));
    }
    return acc;
  }, []);
  const width = pip ? 1320 : 1760;
  const sizes = useMemo(() => {
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
  }, [lines, pip, width]);
  const exit = interpolate(ghost, [0, 1], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (local < 0) {
    return null;
  }
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
      }}
    >
      {lines.map((line, i) => (
        <div key={line} style={{marginBottom: 6}}>
          <div
            style={{
              fontFamily: displayFace,
              fontWeight: 700,
              fontSize: sizes[i],
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: i === 1 ? gold : ink,
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
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};
