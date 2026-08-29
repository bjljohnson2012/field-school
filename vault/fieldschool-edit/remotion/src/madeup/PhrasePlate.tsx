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

const BAND_HEIGHT = 160;
const FADE = 3;

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
  const boxText = page.words.map((word) => word.text).join(" ");
  let bandBox: {width: number; height: number} | null = null;
  if (band) {
    try {
      const box = createRoundedTextBox({
        text: boxText,
        textBoxHorizontalPadding: 28,
        fontFamily: displayFace,
        fontSize: 40,
        fontWeight: "700",
        borderRadius: 14,
        leading: 10,
      });
      bandBox = {width: Math.min(1680, box.width), height: Math.min(BAND_HEIGHT - 16, box.height)};
    } catch {
      bandBox = {width: Math.min(1680, 48 + boxText.length * 22), height: 88};
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        left: band ? 120 : columnLeft,
        top: band ? 1080 - BAND_HEIGHT - 36 : 0,
        width: band ? 1680 : columnWidth,
        height: band ? BAND_HEIGHT : 1080,
        display: "flex",
        alignItems: band ? "center" : "center",
        justifyContent: band ? "center" : "center",
        paddingLeft: band ? 0 : 72,
        paddingRight: band ? 0 : 72,
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
          padding: band ? "18px 28px" : 0,
          textAlign: band ? "center" : leftDock ? "left" : "center",
        }}
      >
        {page.words.map((word, i) => {
          const appear = Math.round((Math.max(word.fromMs, page.appearMs) / 1000) * fps);
          const fade = interpolate(frame, [appear, appear + FADE], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const live = nowMs >= word.fromMs && nowMs < word.toMs;
          const pop = live
            ? spring({
                frame: frame - appear,
                fps,
                durationInFrames: 4,
                config: {damping: 14, mass: 0.4, stiffness: 260},
              })
            : 0;
          const seen = nowMs + 33 >= word.fromMs;
          return (
            <span
              key={`${word.fromMs}-${word.text}-${i}`}
              style={{
                display: "inline-block",
                marginRight: band ? 12 : 16,
                marginBottom: band ? 0 : 10,
                fontFamily: displayFace,
                fontWeight: 700,
                fontSize: band ? 40 : 64,
                letterSpacing: "-0.03em",
                lineHeight: 1.18,
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
