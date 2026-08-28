import {measureText} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import React, {useEffect, useMemo, useState} from "react";
import {bodyFace, displayFace, gold, ink, paper} from "./tokens";
import {waitMadeUpFonts} from "./fonts";
import type {MadeWord} from "./schema";

type CaptionPlateProps = {
  words: MadeWord[];
  nowMs: number;
  docked: boolean;
};

const PAGE_MS = 1400;
const FONT_SIZE = 42;
const LINE_HEIGHT = 1.2;
const PAD = 28;

export const CaptionPlate: React.FC<CaptionPlateProps> = ({words, nowMs, docked}) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    waitMadeUpFonts()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  const page = useMemo(() => {
    const live = words.filter((word) => nowMs >= word.fromMs - 80 && nowMs < word.toMs + PAGE_MS);
    if (live.length === 0) {
      return [] as MadeWord[];
    }
    const start = live[0].fromMs;
    return live.filter((word) => word.fromMs < start + PAGE_MS + 400).slice(0, 10);
  }, [words, nowMs]);

  const line = page.map((word) => word.text).join(" ");

  const box = useMemo(() => {
    if (!ready || line.length === 0) {
      return null;
    }
    try {
      const measured = measureText({
        text: line,
        fontFamily: displayFace,
        fontSize: FONT_SIZE,
        fontWeight: "700",
        letterSpacing: "normal",
        fontVariantNumeric: "normal",
        textTransform: "none",
        additionalStyles: {lineHeight: LINE_HEIGHT},
        validateFontIsLoaded: true,
      });
      const {d, boundingBox} = createRoundedTextBox({
        textMeasurements: [measured],
        textAlign: "left",
        horizontalPadding: PAD,
        borderRadius: 18,
      });
      return {d, boundingBox};
    } catch {
      return {
        d: "",
        boundingBox: {viewBox: "0 0 980 120", width: 980, height: 120, x1: 0, y1: 0, x2: 980, y2: 120},
      };
    }
  }, [line, ready]);

  if (page.length === 0 || !box) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 140,
        width: docked ? 980 : Math.min(1790, box.boundingBox.width + 8),
      }}
    >
      <svg
        viewBox={box.boundingBox.viewBox}
        style={{
          position: "absolute",
          width: box.boundingBox.width,
          height: box.boundingBox.height,
          overflow: "visible",
        }}
      >
        <path d={box.d} fill={paper} />
      </svg>
      <div
        style={{
          position: "relative",
          paddingLeft: PAD,
          paddingRight: PAD,
          paddingTop: 16,
          paddingBottom: 16,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          color: ink,
        }}
      >
        {page.map((word, i) => {
          const active = nowMs >= word.fromMs && nowMs < word.toMs;
          const shown = nowMs >= word.fromMs;
          return (
            <span
              key={`${word.fromMs}-${word.text}-${i}`}
              style={{
                display: "inline-block",
                marginRight: 12,
                color: active ? gold : ink,
                opacity: shown ? 1 : 0,
                scale: active ? 1.04 : 1,
                fontFamily: active ? displayFace : bodyFace,
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
