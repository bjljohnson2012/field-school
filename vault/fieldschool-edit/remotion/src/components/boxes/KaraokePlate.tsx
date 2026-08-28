import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper} from "../../brand/tokens";
import type {CaptionPage} from "../../schema/episode";

type KaraokePlateProps = {
  pages: CaptionPage[];
  nowMs: number;
  originMs: number;
};

export const KaraokePlate: React.FC<KaraokePlateProps> = ({pages, nowMs, originMs}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = pages.find((item) => nowMs >= item.startMs && nowMs < item.endMs);
  if (!page) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 420,
        width: 1040,
        padding: "28px 32px",
        backgroundColor: paper,
        borderRadius: 10,
      }}
    >
      {page.words.map((word, i) => {
        const appear = Math.round(((word.fromMs - originMs) / 1000) * fps);
        const fade = interpolate(frame, [appear, appear + 3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const visible = nowMs >= word.fromMs;
        const active = nowMs >= word.fromMs && nowMs < word.toMs;
        return (
          <span
            key={`${word.fromMs}-${word.text}-${i}`}
            style={{
              display: "inline-block",
              marginRight: 12,
              marginBottom: 8,
              fontFamily: displayFace,
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: active ? gold : ink,
              opacity: visible ? (active ? 1 : 0.7) * fade : 0,
              transform: `scale(${active ? 1.06 : 1})`,
              transformOrigin: "left bottom",
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
