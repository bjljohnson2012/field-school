import {fitTextOnNLines} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import React, {useMemo} from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {pageAt, pagesForShot} from "./phrasePages";
import {displayFace, gold, headReservedPx, ink, paper} from "./tokens";
import type {MadePhrase, MadeWord, ShotLayout} from "./schema";

type PhrasePlateProps = {
  words: MadeWord[];
  nowMs: number;
  fromMs: number;
  toMs: number;
  layout: ShotLayout;
  phrases?: MadePhrase[];
};

const BAND_HEIGHT = 168;
const FADE = 3;
const DOCK_PAD = 40;

const dockFontSize = (pageWords: MadeWord[], boxWidth: number): number => {
  const count = pageWords.length;
  const maxLines = count <= 6 ? 3 : count <= 12 ? 4 : 5;
  const maxSize = count <= 6 ? 176 : count <= 12 ? 148 : 124;
  const fallback = count <= 6 ? 140 : count <= 12 ? 108 : 86;
  const text = pageWords.map((word) => word.text).join(" ");
  if (!text) {
    return fallback;
  }
  try {
    const fit = fitTextOnNLines({
      text,
      maxLines,
      maxBoxWidth: boxWidth,
      fontFamily: displayFace,
      fontWeight: 700,
      letterSpacing: "-0.04em",
      maxFontSize: maxSize,
    });
    return Math.max(76, Math.round(fit.fontSize));
  } catch {
    return fallback;
  }
};

export const PhrasePlate: React.FC<PhrasePlateProps> = ({words, nowMs, fromMs, toMs, layout, phrases}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pages = useMemo(() => pagesForShot(words, fromMs, toMs, phrases), [fromMs, phrases, toMs, words]);
  const page = pageAt(pages, nowMs);
  if (!page || layout === "off" || layout === "pip-tr") {
    return null;
  }
  const band = layout === "letterbox";
  const leftDock = layout === "dock-left";
  const reserved = headReservedPx();
  const columnLeft = leftDock ? reserved : 0;
  const columnWidth = 1920 - reserved;
  const boxWidth = columnWidth - DOCK_PAD * 2;
  const dockSize = dockFontSize(page.words, boxWidth);
  const liveCount = page.words.filter((word) => nowMs + 40 >= word.fromMs).length;
  const boxText = page.words
    .slice(0, Math.max(1, liveCount))
    .map((word) => word.text)
    .join(" ");
  let bandBox: {width: number; height: number} | null = null;
  if (band) {
    try {
      const box = createRoundedTextBox({
        text: boxText,
        textBoxHorizontalPadding: 28,
        fontFamily: displayFace,
        fontSize: 36,
        fontWeight: "700",
        borderRadius: 14,
        leading: 8,
      });
      bandBox = {width: Math.min(1680, box.width), height: Math.min(BAND_HEIGHT - 12, box.height)};
    } catch {
      bandBox = {width: Math.min(1680, 48 + boxText.length * 18), height: 96};
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        left: band ? 120 : columnLeft,
        top: band ? 1080 - BAND_HEIGHT - 28 : 0,
        width: band ? 1680 : columnWidth,
        height: band ? BAND_HEIGHT : 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: band ? "center" : "flex-start",
        paddingLeft: band ? 0 : DOCK_PAD,
        paddingRight: band ? 0 : DOCK_PAD,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: band && bandBox ? bandBox.width : "100%",
          maxWidth: "100%",
          backgroundColor: band ? paper : "transparent",
          outline: band ? `3px solid ${ink}22` : "none",
          borderRadius: band ? 14 : 0,
          padding: band ? "16px 24px" : 0,
          textAlign: band ? "center" : "left",
        }}
      >
        {page.words.map((word, i) => {
          const appear = Math.round((word.fromMs / 1000) * fps);
          const fade = interpolate(frame, [appear - 1, appear + FADE], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const live = nowMs >= word.fromMs && nowMs < word.toMs;
          const pop = live
            ? spring({
                frame: Math.max(0, frame - appear),
                fps,
                durationInFrames: 4,
                config: {damping: 14, mass: 0.4, stiffness: 260},
              })
            : 0;
          const seen = nowMs + 40 >= word.fromMs;
          return (
            <span
              key={`${word.fromMs}-${word.text}-${i}`}
              style={{
                display: "inline-block",
                marginRight: band ? 12 : 22,
                marginBottom: band ? 0 : 6,
                fontFamily: displayFace,
                fontWeight: 700,
                fontSize: band ? 48 : dockSize,
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                color: live ? gold : ink,
                opacity: seen ? fade : 0,
                scale: `${1 + pop * 0.06}`,
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
