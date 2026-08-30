import {measureText} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import React, {useEffect, useMemo, useState} from "react";
import {useDelayRender} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {CAPTION_BOTTOM, INSET, TYPE_COL, bodyFace, displayFace, gold, ink, paper} from "./tokens";
import type {MadeWord} from "./schema";

type CaptionPlateProps = {
  words: MadeWord[];
  nowMs: number;
  docked: boolean;
};

const PAGE_MS = 1400;
const MAX_SIZE = 42;
const LINE_HEIGHT = 1.15;
const PAD = 24;

const measureOpts = {
  fontFamily: displayFace,
  fontWeight: "700" as const,
  letterSpacing: "normal" as const,
  fontVariantNumeric: "normal" as const,
  textTransform: "none" as const,
  additionalStyles: {lineHeight: LINE_HEIGHT},
  validateFontIsLoaded: true,
};

const wrapPage = (page: MadeWord[], maxWidth: number, fontSize: number): MadeWord[][] => {
  const lines: MadeWord[][] = [[]];
  let lineText = "";
  for (const word of page) {
    const next = lineText ? `${lineText} ${word.text}` : word.text;
    const {width} = measureText({text: next, fontSize, ...measureOpts});
    if (width > maxWidth && lineText) {
      lines.push([word]);
      lineText = word.text;
    } else {
      lines[lines.length - 1].push(word);
      lineText = next;
    }
  }
  return lines.filter((line) => line.length > 0);
};

export const CaptionPlate: React.FC<CaptionPlateProps> = ({words, nowMs, docked}) => {
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender("caption-fonts"));
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

  const page = useMemo(() => {
    const shown = words.filter((word) => nowMs >= word.fromMs);
    if (shown.length === 0) {
      return [] as MadeWord[];
    }
    const last = shown[shown.length - 1];
    return shown.filter((word) => word.fromMs >= last.fromMs - PAGE_MS).slice(-8);
  }, [words, nowMs]);

  const boxWidth = docked ? TYPE_COL : 1600;

  const layout = useMemo(() => {
    if (!ready || page.length === 0) {
      return null;
    }
    try {
      const inner = boxWidth - PAD * 2;
      let fontSize = MAX_SIZE;
      let lines = wrapPage(page, inner, fontSize);
      while (lines.length > 2 && fontSize > 28) {
        fontSize -= 2;
        lines = wrapPage(page, inner, fontSize);
      }
      lines = lines.slice(0, 2);
      const textMeasurements = lines.map((line) =>
        measureText({
          text: line.map((word) => word.text).join(" "),
          fontSize,
          ...measureOpts,
        }),
      );
      const {d, boundingBox} = createRoundedTextBox({
        textMeasurements,
        textAlign: "left",
        horizontalPadding: PAD,
        borderRadius: 16,
      });
      return {d, boundingBox, lines, fontSize};
    } catch {
      return null;
    }
  }, [boxWidth, page, ready]);

  if (!layout) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: INSET,
        bottom: CAPTION_BOTTOM,
        width: layout.boundingBox.width,
        height: layout.boundingBox.height,
        overflow: "visible",
      }}
    >
      <svg
        viewBox={layout.boundingBox.viewBox}
        style={{
          position: "absolute",
          width: layout.boundingBox.width,
          height: layout.boundingBox.height,
          overflow: "visible",
        }}
      >
        <path d={layout.d} fill={paper} />
      </svg>
      <div style={{position: "relative", paddingLeft: PAD, paddingRight: PAD}}>
        {layout.lines.map((line, lineIndex) => (
          <div
            key={`line-${lineIndex}`}
            style={{
              fontFamily: displayFace,
              fontWeight: 700,
              fontSize: layout.fontSize,
              lineHeight: LINE_HEIGHT,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {line.map((word, i) => {
              const active = nowMs >= word.fromMs && nowMs < word.toMs;
              return (
                <span
                  key={`${word.fromMs}-${word.text}-${i}`}
                  style={{
                    display: "inline-block",
                    marginRight: 10,
                    color: active ? gold : ink,
                    scale: active ? 1.04 : 1,
                    fontFamily: active ? displayFace : bodyFace,
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
