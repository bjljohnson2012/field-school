import React, {useMemo} from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {WORD_FADE_FRAMES, blue, displayFace, ink} from "../../brand/tokens";
import {pageAt, pagesWithHold} from "../../pages";
import type {CaptionWord} from "../../schema/episode";

type KaraokePlateProps = {
  words: CaptionWord[];
  nowMs: number;
  originMs: number;
};

const FONT_SIZE = 44;
const LINE_HEIGHT = 1.2;

export const KaraokePlate: React.FC<KaraokePlateProps> = ({words, nowMs, originMs}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pages = useMemo(() => pagesWithHold(words), [words]);
  const page = pageAt(pages, nowMs);
  if (!page) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 360,
        width: 1040,
        whiteSpace: "pre-wrap",
      }}
    >
      {page.words.map((word, i) => {
        const appearMs = Math.max(word.fromMs, page.appearMs);
        const appear = Math.round(((appearMs - originMs) / 1000) * fps);
        const fade = interpolate(frame, [appear, appear + WORD_FADE_FRAMES], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const spoken = nowMs >= word.fromMs;
        const active = nowMs >= word.fromMs && nowMs < word.toMs;
        const ready = nowMs >= appearMs;
        return (
          <span
            key={`${word.fromMs}-${word.text}-${i}`}
            style={{
              display: "inline-block",
              marginRight: 14,
              marginBottom: 10,
              fontFamily: displayFace,
              fontWeight: 700,
              fontSize: FONT_SIZE,
              letterSpacing: "-0.03em",
              lineHeight: LINE_HEIGHT,
              color: active ? blue : ink,
              opacity: ready ? (spoken && active ? 1 : 0.88) * fade : 0,
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
