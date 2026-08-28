import React, {useMemo} from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {TYPE_BESIDE, TYPE_SOLO, WORD_FADE_FRAMES, blue, displayFace, headReservedPx, ink} from "../../brand/tokens";
import {pageForClock, type DropOff} from "../../dropOff";
import type {CaptionWord} from "../../schema/episode";

type KaraokePlateProps = {
  words: CaptionWord[];
  nowMs: number;
  originMs: number;
  solo: number;
  drop: DropOff | null;
  lift?: number;
};

const LINE_HEIGHT = 1.18;

export const KaraokePlate: React.FC<KaraokePlateProps> = ({words, nowMs, originMs, solo, drop, lift = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = useMemo(() => pageForClock(words, nowMs, drop), [words, nowMs, drop]);
  if (!page) {
    return null;
  }
  const fieldWidth = interpolate(solo, [0, 1], [1920 - headReservedPx(), 1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fontSize = interpolate(solo, [0, 1], [TYPE_BESIDE, TYPE_SOLO], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sidePad = interpolate(solo, [0, 1], [72, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: fieldWidth,
        height: 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: sidePad,
        paddingRight: sidePad,
        boxSizing: "border-box",
        transform: `translateY(${-lift * 72}px)`,
      }}
    >
      <div style={{textAlign: "center", width: "100%", maxWidth: "100%"}}>
        {page.words.map((word, i) => {
          const appearMs = Math.max(word.fromMs, page.appearMs);
          const appear = Math.round(((appearMs - originMs) / 1000) * fps);
          const fade = interpolate(frame, [appear, appear + WORD_FADE_FRAMES], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const active = nowMs >= word.fromMs && nowMs < word.toMs;
          const ready = nowMs >= appearMs;
          return (
            <span
              key={`${word.fromMs}-${word.text}-${i}`}
              style={{
                display: "inline-block",
                marginRight: 16,
                marginBottom: 12,
                fontFamily: displayFace,
                fontWeight: 700,
                fontSize,
                letterSpacing: "-0.03em",
                lineHeight: LINE_HEIGHT,
                color: active ? blue : ink,
                opacity: ready ? (active ? 1 : 0.88) * fade : 0,
                transform: `translateY(${(1 - fade) * 10}px)`,
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
