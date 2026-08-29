import {createTikTokStyleCaptions} from "@remotion/captions";
import {fitText} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import React, {useMemo} from "react";
import {displayFace, fieldGold, fieldInk, fieldPaper} from "../../brand/tokens";
import {wordsToCaptions} from "../../captions";
import type {CaptionWord} from "../../schema/episode";

type CaptionPlateProps = {
  words: CaptionWord[];
  nowMs: number;
  width?: number;
};

const PAGE_MS = 1400;

export const CaptionPlate: React.FC<CaptionPlateProps> = ({words, nowMs, width = 1680}) => {
  const pages = useMemo(() => {
    return createTikTokStyleCaptions({
      captions: wordsToCaptions(words),
      combineTokensWithinMilliseconds: PAGE_MS,
    }).pages;
  }, [words]);
  const page = pages.find((item) => nowMs >= item.startMs && nowMs < item.startMs + item.durationMs + 400);
  if (!page) {
    return null;
  }
  const text = page.tokens.map((token) => token.text).join("");
  let fontSize = 42;
  try {
    fontSize = Math.min(
      42,
      fitText({
        text,
        withinWidth: width - 48,
        fontFamily: displayFace,
        fontWeight: "700",
      }).fontSize,
    );
  } catch {
    fontSize = 42;
  }
  const box = createRoundedTextBox({
    text,
    textBoxHorizontalPadding: 24,
    fontFamily: displayFace,
    fontSize,
    fontWeight: "700",
    borderRadius: 8,
    leading: 8,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        bottom: 120,
        width,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: box.width,
          height: box.height,
          backgroundColor: fieldPaper,
          color: fieldInk,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize,
          padding: "12px 24px",
          boxSizing: "border-box",
        }}
      >
        {page.tokens.map((token) => {
          const live = nowMs >= token.fromMs && nowMs < token.toMs;
          const seen = nowMs >= token.fromMs;
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                color: live ? fieldGold : fieldInk,
                opacity: seen ? 1 : 0,
                scale: live ? "1.06" : "1",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
