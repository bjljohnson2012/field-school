import React, {useMemo} from "react";
import {createTikTokStyleCaptions, type Caption, type TikTokPage, type TikTokToken} from "@remotion/captions";
import {measureText} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {gold, ink, paper, sansFace} from "../../brand";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

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

/** One caption band. Ink chip, paper type, gold active word. */
export const KaraokePlate: React.FC<{captions: Caption[]}> = ({captions}) => {
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
        letterSpacing: "0.08em",
        validateFontIsLoaded: true,
      }),
    );
    const box = createRoundedTextBox({
      textMeasurements,
      textAlign: "center",
      horizontalPadding: 22,
      borderRadius: 16,
    });
    return {rows, box};
  }, [page]);

  if (!page || !plate) {
    return null;
  }

  const top = 960 - plate.box.boundingBox.height / 2;
  const left = (width - plate.box.boundingBox.width) / 2;
  const rowTokens = linesOf(page.tokens);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: plate.box.boundingBox.width,
        height: plate.box.boundingBox.height,
      }}
    >
      <svg
        width={plate.box.boundingBox.width}
        height={plate.box.boundingBox.height}
        style={{position: "absolute", left: 0, top: 0}}
      >
        <path d={plate.box.d} fill={ink} fillOpacity={0.9} />
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
          letterSpacing: "0.08em",
          lineHeight: 1.15,
        }}
      >
        {rowTokens.map((tokens, row) => (
          <div key={row} style={{whiteSpace: "pre", textAlign: "center"}}>
            {tokens.map((token, index) => {
              const local = ((ms - token.fromMs) / 1000) * fps;
              const fade = interpolate(local, [0, 3], [0, 1], clamp);
              const active = ms >= token.fromMs && ms < token.toMs;
              return (
                <span
                  key={`${token.fromMs}-${index}`}
                  style={{
                    opacity: fade,
                    color: active ? gold : paper,
                    scale: active ? 1.06 : 1,
                    display: "inline-block",
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
