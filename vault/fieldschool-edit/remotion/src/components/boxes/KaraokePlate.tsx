import {createTikTokStyleCaptions} from "@remotion/captions";
import {measureText} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import React, {useEffect, useMemo, useState} from "react";
import {continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper} from "../../brand/tokens";
import {wordsToCaptions} from "../../captions";
import type {CaptionWord} from "../../schema/episode";

type KaraokePlateProps = {
  words: CaptionWord[];
  nowMs: number;
  originMs: number;
};

const FONT_SIZE = 44;
const LINE_HEIGHT = 1.15;
const PAD_X = 28;

const measureLine = (text: string) => {
  try {
    return measureText({
      text,
      fontFamily: "Fraunces",
      fontSize: FONT_SIZE,
      fontWeight: "700",
      letterSpacing: "-0.03em",
      fontVariantNumeric: "normal",
      textTransform: "none",
      validateFontIsLoaded: true,
      additionalStyles: {lineHeight: LINE_HEIGHT},
    });
  } catch {
    return {
      width: Math.max(80, text.length * FONT_SIZE * 0.52),
      height: FONT_SIZE * LINE_HEIGHT,
    };
  }
};

export const KaraokePlate: React.FC<KaraokePlateProps> = ({words, nowMs, originMs}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [handle] = useState(() => delayRender("karaoke-fonts"));
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      setFontsReady(true);
      continueRender(handle);
    };
    void document.fonts.ready.then(finish);
    const timer = window.setTimeout(finish, 2500);
    return () => window.clearTimeout(timer);
  }, [handle]);

  const {pages} = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions: wordsToCaptions(words),
        combineTokensWithinMilliseconds: 1400,
      }),
    [words],
  );

  const page = pages.find((item, i) => {
    const next = pages[i + 1];
    const last = item.tokens[item.tokens.length - 1];
    const end = next ? next.startMs : (last ? last.toMs : item.startMs) + 200;
    return nowMs >= item.startMs && nowMs < end;
  });

  const box = useMemo(() => {
    if (!page || !fontsReady) {
      return null;
    }
    const line = page.tokens.map((token) => token.text.trim()).join(" ");
    if (!line) {
      return null;
    }
    return createRoundedTextBox({
      textMeasurements: [measureLine(line)],
      textAlign: "left",
      horizontalPadding: PAD_X,
      borderRadius: 12,
    });
  }, [fontsReady, page]);

  if (!page || !box) {
    return null;
  }

  return (
    <div style={{position: "absolute", left: 64, top: 400, width: box.boundingBox.width, height: box.boundingBox.height}}>
      <svg
        viewBox={box.boundingBox.viewBox}
        style={{position: "absolute", width: box.boundingBox.width, height: box.boundingBox.height, overflow: "visible"}}
      >
        <path d={box.d} fill={paper} />
      </svg>
      <div
        style={{
          position: "relative",
          paddingLeft: PAD_X,
          paddingRight: PAD_X,
          whiteSpace: "pre",
        }}
      >
        {page.tokens.map((token, i) => {
          const appear = Math.round(((token.fromMs - originMs) / 1000) * fps);
          const fade = interpolate(frame, [appear, appear + 3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const visible = nowMs >= token.fromMs;
          const active = nowMs >= token.fromMs && nowMs < token.toMs;
          return (
            <span
              key={`${token.fromMs}-${token.text}-${i}`}
              style={{
                display: "inline-block",
                marginRight: 12,
                fontFamily: displayFace,
                fontWeight: 700,
                fontSize: FONT_SIZE,
                letterSpacing: "-0.03em",
                lineHeight: LINE_HEIGHT,
                color: active ? gold : ink,
                opacity: visible ? (active ? 1 : 0.7) * fade : 0,
                transform: `scale(${active ? 1.06 : 1})`,
                transformOrigin: "left bottom",
              }}
            >
              {token.text.trim()}
            </span>
          );
        })}
      </div>
    </div>
  );
};
