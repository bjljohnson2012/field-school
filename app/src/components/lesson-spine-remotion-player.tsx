"use client";

import { Player } from "@remotion/player";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

const FPS = 30;
const BEATS = [
  { id: "sting", label: "Sting", durationSec: 10 },
  { id: "slate", label: "Slate", durationSec: 8 },
  { id: "objective", label: "Objective", durationSec: 6 },
  { id: "recap", label: "Recap", durationSec: 10 },
  { id: "nextUp", label: "Next up", durationSec: 7 },
] as const;

function layout() {
  let from = 0;
  return BEATS.map((beat) => {
    const frames = Math.round(beat.durationSec * FPS);
    const row = { ...beat, from, frames };
    from += frames;
    return row;
  });
}

const ROWS = layout();
export const LESSON_SPINE_DURATION_IN_FRAMES = ROWS.reduce((sum, row) => sum + row.frames, 0);

function BeatCard({ label }: { label: string }) {
  const frame = useCurrentFrame();
  const enter = Math.min(1, frame / 12);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#EFE7D6",
        color: "#1A1A16",
        justifyContent: "center",
        padding: 72,
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 16}px)`,
          borderLeft: "6px solid #C4A35A",
          paddingLeft: 28,
          maxWidth: 1040,
        }}
      >
        <p style={{ fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>LessonSpine</p>
        <h2 style={{ fontSize: 72, lineHeight: 1.05, margin: "12px 0 0" }}>{label}</h2>
        <p style={{ fontSize: 24, margin: "16px 0 0" }}>
          Household: the child has no login. Sales: this desk lists no children.
        </p>
      </div>
    </AbsoluteFill>
  );
}

export function LessonSpineComposition() {
  return (
    <AbsoluteFill>
      {ROWS.map((row) => (
        <Sequence key={row.id} from={row.from} durationInFrames={row.frames} name={row.id}>
          <BeatCard label={row.label} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

export function LessonSpineRemotionPreview() {
  return (
    <section
      className="mt-8"
      data-remotion-player="lesson-spine"
      data-composition="LessonSpine"
      data-rooms="household,sales"
      data-login="none"
      data-sales-children="0"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Remotion preview</p>
      <h2 className="mt-1 font-display text-2xl tracking-tight">LessonSpine composition</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Same beat clock as the factory composition: sting, slate, objective, recap, next up. The HTML5 rail above
        still plays the locked master. This preview does not take a Cap and does not write a master.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-black">
        <Player
          component={LessonSpineComposition}
          durationInFrames={LESSON_SPINE_DURATION_IN_FRAMES}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={FPS}
          controls
          style={{ width: "100%" }}
        />
      </div>
    </section>
  );
}
