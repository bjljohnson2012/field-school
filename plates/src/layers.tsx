import React, {useMemo} from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {bodyFace, charcoal, cream, displayFace, gold, ink, olive, sansFace} from "./brand";
import {glideCard, takeoverHead} from "./sceneMotionMath";
import type {Caption, Overlay} from "./types";

export function Bed() {
  return <AbsoluteFill style={{backgroundColor: cream}} />;
}

export function OverlayLock({overlay}: {overlay: Overlay}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: overlay.x - 420,
          top: overlay.y,
          width: 410,
          height: overlay.h,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "0em",
          wordSpacing: "0.12em",
          lineHeight: `${overlay.h}px`,
          color: ink,
          textAlign: "right",
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

export function LowerThird({label}: {label: string}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        bottom: 48,
        fontFamily: sansFace,
        fontSize: 20,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: gold,
      }}
    >
      {label}
    </div>
  );
}

export function Karaoke({captions}: {captions: Caption[]}) {
  const frame = useCurrentFrame();
  const nowMs = (frame / 30) * 1000;
  const words = useMemo(() => captions, [captions]);
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 820,
        bottom: 96,
        fontFamily: sansFace,
        fontSize: 28,
        lineHeight: 1.35,
        letterSpacing: "0em",
        wordSpacing: "0.12em",
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
      }}
    >
      {words.map((word) => {
        const from = Math.round((word.startMs / 1000) * 30);
        const spoken = nowMs >= word.startMs && nowMs < word.endMs;
        const done = nowMs >= word.endMs;
        return (
          <span
            key={`${word.startMs}-${word.text}`}
            style={{
              color: spoken ? gold : done ? ink : "#7a746a",
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

export function Letterbox() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: ink,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: ink,
        }}
      />
    </>
  );
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
        letterSpacing: "0em",
        wordSpacing: "0.12em",
        lineHeight: 1.12,
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
        lineHeight: 1.3,
        letterSpacing: "0em",
        wordSpacing: "0.12em",
        color,
        maxWidth: 960,
      }}
    >
      {children}
    </div>
  );
}
