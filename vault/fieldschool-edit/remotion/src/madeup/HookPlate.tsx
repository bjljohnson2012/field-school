import {fitText} from "@remotion/layout-utils";
import React, {useMemo} from "react";
import {hasHeard, heardSince} from "./spoken";
import {displayFace, gold, ink} from "./tokens";
import type {MadeWord} from "./schema";

type HookPlateProps = {
  text: string;
  local: number;
  ghost?: number;
  pip?: boolean;
  words?: MadeWord[];
  nowMs?: number;
  fromMs?: number;
};

type Beat = {
  line: string;
  needles: string[];
};

const BEATS: Record<string, Beat[]> = {
  "PEOPLE CANNOT GET THINGS DONE": [
    {line: "PEOPLE", needles: ["people"]},
    {line: "CANNOT GET", needles: ["cannot"]},
    {line: "THINGS DONE", needles: ["things", "done"]},
  ],
  "PEOPLE WAIT TO BE TOLD": [
    {line: "PEOPLE", needles: ["people"]},
    {line: "CANNOT GET", needles: ["cannot"]},
    {line: "THINGS DONE", needles: ["things", "done"]},
  ],
  "YOU CAN JUST DO THINGS": [
    {line: "YOU CAN", needles: ["you"]},
    {line: "JUST DO", needles: ["just"]},
    {line: "THINGS", needles: ["things"]},
  ],
};

export const HookPlate: React.FC<HookPlateProps> = ({
  text,
  local,
  ghost = 0,
  pip = false,
  words = [],
  nowMs = 0,
  fromMs = 0,
}) => {
  const beats = BEATS[text] || text.split(" ").map((line) => ({line, needles: [line.toLowerCase()]}));
  const heard = heardSince(words, nowMs, Math.max(0, fromMs - 40));
  const live = beats.filter((beat, i) => i === 0 || hasHeard(heard, beat.needles));
  const lines = live.length > 0 ? live.map((beat) => beat.line) : [beats[0]?.line || text];
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
  if (local < 0 || ghost >= 1) {
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
        opacity: 1,
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
