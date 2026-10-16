import React, {useMemo} from "react";
import {createTikTokStyleCaptions, type Caption, type TikTokPage, type TikTokToken} from "@remotion/captions";
import {measureText} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {captionActive, captionBg, captionFg, sansFace} from "../../brand";

const FONT = 44;
const LINE_CHARS = 32;

function pageFrom(tokens: TikTokToken[]): TikTokPage {
  const text = tokens.map((token) => token.text).join("");
  const startMs = tokens[0].fromMs;
  const endMs = tokens[tokens.length - 1].toMs;
  return {text, startMs, tokens, durationMs: Math.max(1, endMs - startMs)};
}

/** Keep the 1400ms pages, then break any page into two lines of 32 characters. */
function reflow(pages: TikTokPage[]): TikTokPage[] {
  const out: TikTokPage[] = [];
  for (const page of pages) {
    let bucket: TikTokToken[] = [];
    let lines = 1;
    let count = 0;
    const flush = () => {
      if (bucket.length) {
        out.push(pageFrom(bucket));
      }
      bucket = [];
      lines = 1;
      count = 0;
    };
    for (const token of page.tokens) {
      const word = token.text.trim();
      const extra = word.length + (count > 0 ? 1 : 0);
      if (count > 0 && count + extra > LINE_CHARS) {
        if (lines >= 2) {
          flush();
        } else {
          lines += 1;
          count = 0;
        }
      }
      bucket.push(token);
      count += word.length + (count > 0 ? 1 : 0);
    }
    flush();
  }
  return out;
}

function linesOf(tokens: TikTokToken[]): TikTokToken[][] {
  const lines: TikTokToken[][] = [[], []];
  let line = 0;
  let count = 0;
  for (const token of tokens) {
    const word = token.text.trim();
    const extra = word.length + (count > 0 ? 1 : 0);
    if (count > 0 && count + extra > LINE_CHARS && line === 0) {
      line = 1;
      count = 0;
    }
    lines[line].push(token);
    count += word.length + (count > 0 ? 1 : 0);
  }
  return lines.filter((lineTokens) => lineTokens.length > 0);
}

/** TikTok pages in a lower band. The chip is the measured text. Cards pass no window. */
export const KaraokePlate: React.FC<{
  captions: Caption[];
  fromFrame: number;
  untilFrame: number;
}> = ({captions, fromFrame, untilFrame}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => {
    const grouped = createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: 1400,
    }).pages;
    return reflow(grouped);
  }, [captions]);
  const page = pages.find((item) => ms >= item.startMs && ms < item.startMs + item.durationMs);
  const plate = useMemo(() => {
    if (!page) {
      return null;
    }
    const rows = linesOf(page.tokens).map((tokens) => tokens.map((token) => token.text).join(""));
    const textMeasurements = rows.map((text) =>
      measureText({
        text,
        fontFamily: sansFace,
        fontSize: FONT,
        fontWeight: "600",
        letterSpacing: "0px",
        validateFontIsLoaded: true,
      }),
    );
    const box = createRoundedTextBox({
      textMeasurements,
      textAlign: "center",
        horizontalPadding: 36,
      borderRadius: 16,
    });
    return {rows, box};
  }, [page]);

  if (!page || !plate || frame < fromFrame || frame >= untilFrame) {
    return null;
  }

  const left = (width - plate.box.boundingBox.width) / 2;
  const rowTokens = linesOf(page.tokens);

  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom: 48,
        width: plate.box.boundingBox.width,
        height: plate.box.boundingBox.height,
      }}
    >
      <svg
        width={plate.box.boundingBox.width}
        height={plate.box.boundingBox.height}
        style={{position: "absolute", left: 0, top: 0}}
      >
        <path d={plate.box.d} fill={captionBg} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: plate.box.boundingBox.width,
          height: plate.box.boundingBox.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: sansFace,
          fontWeight: 600,
          fontSize: FONT,
          letterSpacing: "0px",
          lineHeight: 1.15,
        }}
      >
        {rowTokens.map((tokens, row) => (
          <div key={row} style={{whiteSpace: "pre", textAlign: "center"}}>
            {tokens.map((token, index) => {
              const active = ms >= token.fromMs && ms < token.toMs;
              return (
                <span
                  key={`${token.fromMs}-${index}`}
                  style={{
                    color: active ? captionActive : captionFg,
                    display: "inline",
                  }}
                >
                  {token.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
