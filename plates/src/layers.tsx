import React, {useMemo} from "react";
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {bodyFace, charcoal, cream, displayFace, gold, ink, olive, sansFace} from "./brand";
import {glideCard, TAKEOVER_EASE_FRAMES, takeoverHead} from "./sceneMotionMath";
import type {Caption, Overlay} from "./types";
import {wordClock, wordColor} from "./wordClock";

/** Ink bars + gold inner rule. Close-in over TAKEOVER_EASE_FRAMES. After captions, before audio. */
export const LETTERBOX_H = 48;

export function Bed() {
  return <AbsoluteFill style={{backgroundColor: cream}} />;
}

export function OverlayLock({overlay}: {overlay: Overlay}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: overlay.x - 520,
          top: overlay.y,
          width: 508,
          height: overlay.h,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: "0.02em",
          wordSpacing: "0.2em",
          lineHeight: `${overlay.h}px`,
          color: ink,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {overlay.title}
      </div>
      <Img
        src={staticFile("isolated-seal.svg")}
        style={{
          position: "absolute",
          left: overlay.x,
          top: overlay.y,
          width: overlay.w,
          height: overlay.h,
          objectFit: "contain",
        }}
      />
    </>
  );
}

export function GoldRule() {
  return (
    <div
      style={{
        width: 96,
        height: 3,
        backgroundColor: gold,
        margin: "28px 0",
      }}
    />
  );
}

export function TypeCard({
  motion,
  sceneFrame,
  children,
}: {
  motion: "glide" | "takeover";
  sceneFrame: number;
  children: React.ReactNode;
}) {
  // VOX-S04 cream + 6px gold rail. EDU-S02 last-word ticks live in children (`Keyword`).
  const glide = glideCard(sceneFrame);
  const opacity = motion === "glide" ? glide.opacity : 1;
  const x = motion === "glide" ? glide.x : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 160,
        width: 1040,
        opacity,
        translate: `${x}px 0px`,
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
        padding: "24px 32px 28px",
      }}
    >
      {children}
    </div>
  );
}

export function HeadFixture() {
  return (
    <AbsoluteFill style={{backgroundColor: charcoal}}>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 200,
          width: 420,
          height: 420,
          borderRadius: 210,
          backgroundColor: olive,
        }}
      />
    </AbsoluteFill>
  );
}

export function HeadDock({
  motion,
  sceneFrame,
  dock = "dock-right",
}: {
  motion: "glide" | "takeover";
  sceneFrame: number;
  dock?: "dock-right" | "dock-left";
}) {
  const head = takeoverHead(sceneFrame);
  const opacity = motion === "takeover" ? head.opacity : 1;
  const x = motion === "takeover" ? head.x : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: dock === "dock-left" ? 60 : 1160,
        top: 150,
        width: 700,
        height: 820,
        overflow: "hidden",
        borderRadius: 22,
        backgroundColor: charcoal,
        opacity,
        translate: `${x}px 0px`,
      }}
    >
      <HeadFixture />
    </div>
  );
}

export function LowerThird({
  name,
  role,
  label,
}: {
  name?: string;
  role?: string;
  label?: string;
}) {
  const frame = useCurrentFrame();
  const glide = glideCard(frame);
  const title = (name || label || "").trim();
  const sub = (role || "").trim();
  if (!title) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        bottom: LETTERBOX_H + 16,
        width: 720,
        opacity: glide.opacity,
        translate: `${glide.x}px 0px`,
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
        padding: "16px 28px 18px",
      }}
    >
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: "0.01em",
          wordSpacing: "0.16em",
          lineHeight: 1.12,
          color: ink,
        }}
      >
        {title}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 8,
            fontFamily: sansFace,
            fontSize: 18,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: gold,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export function CaptionsBand({captions}: {captions: Caption[]}) {
  const frame = useCurrentFrame();
  const nowMs = (frame / 30) * 1000;
  const clock = useMemo(() => wordClock(captions, nowMs), [captions, nowMs]);
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 820,
        bottom: LETTERBOX_H + 140,
        minHeight: 72,
        padding: "12px 8px 4px 0",
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: 32,
        lineHeight: 1.3,
        letterSpacing: "0em",
        wordSpacing: "0.12em",
        whiteSpace: "pre",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {clock.words.map((word) => {
        const from = Math.round((word.startMs / 1000) * 30);
        const active = word.state === "active";
        return (
          <span
            key={`${word.startMs}-${word.text}`}
            style={{
              color: wordColor(word.state),
              borderBottom: active ? `3px solid ${gold}` : "3px solid transparent",
              opacity: interpolate(frame, [from, from + 6], [0.35, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}

/** Alias kept for checklist / existing plates. Captions layer is CaptionsBand. */
export function Karaoke({captions}: {captions: Caption[]}) {
  return <CaptionsBand captions={captions} />;
}

export function Letterbox() {
  const frame = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: interpolate(frame, [0, TAKEOVER_EASE_FRAMES], [0, LETTERBOX_H], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          backgroundColor: ink,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: interpolate(frame, [0, TAKEOVER_EASE_FRAMES], [0, LETTERBOX_H], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: gold,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: interpolate(frame, [0, TAKEOVER_EASE_FRAMES], [0, LETTERBOX_H], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          backgroundColor: ink,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: interpolate(frame, [0, TAKEOVER_EASE_FRAMES], [0, LETTERBOX_H], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: gold,
        }}
      />
    </>
  );
}

/** Soft-unmuted silent fixture bed. Last sibling after letterbox. Volume 0. No Cap A-roll. */
export const AUDIO_BED_FILE = "audio-bed-silence.wav";
export const AUDIO_BED_VOLUME = 0;
export const AUDIO_BED_MUTED = false;

export function AudioBed({
  src = staticFile(AUDIO_BED_FILE),
  volume = AUDIO_BED_VOLUME,
  muted = AUDIO_BED_MUTED,
}: {
  src?: string;
  volume?: number;
  muted?: boolean;
} = {}) {
  return <Audio src={src} volume={muted ? 0 : volume} loop muted={muted} />;
}

export function Kicker({children}: {children: React.ReactNode}) {
  return (
    <div
      style={{
        fontFamily: sansFace,
        fontSize: 20,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: gold,
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  );
}

export function Title({children}: {children: React.ReactNode}) {
  return (
    <div
      style={{
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: 56,
        letterSpacing: "0.01em",
        wordSpacing: "0.16em",
        lineHeight: 1.16,
        color: ink,
        maxWidth: 1000,
      }}
    >
      {children}
    </div>
  );
}

export function Claim({children, color = ink}: {children: React.ReactNode; color?: string}) {
  return (
    <div
      style={{
        fontFamily: bodyFace,
        fontSize: 36,
        lineHeight: 1.32,
        letterSpacing: "0.01em",
        wordSpacing: "0.14em",
        color,
        maxWidth: 960,
      }}
    >
      {children}
    </div>
  );
}

/** EDU-S01 pre-training slate. Prefix is always "You will be able to". Last-word EDU-S02 gold tick. */
export function ObjectiveSlate({
  objective,
  sceneFrame,
  from = 30,
}: {
  objective: string;
  sceneFrame: number;
  from?: number;
}) {
  const opacity = interpolate(sceneFrame, [from, from + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const words = objective.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? objective;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div style={{opacity, marginTop: 28, maxWidth: 960}}>
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 20,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
          marginBottom: 10,
        }}
      >
        You will be able to
      </div>
      <div
        style={{
          fontFamily: bodyFace,
          fontSize: 32,
          lineHeight: 1.28,
          letterSpacing: "0.01em",
          wordSpacing: "0.14em",
          color: ink,
          display: "inline-block",
          paddingBottom: 4,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** EDU-S02 signaling. Gold color + 3px gold tick on the keyword. */
export function Keyword({children}: {children: React.ReactNode}) {
  return (
    <span
      style={{
        color: gold,
        borderBottom: `3px solid ${gold}`,
        paddingBottom: 4,
      }}
    >
      {children}
    </span>
  );
}
