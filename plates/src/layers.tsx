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

/** Logo+title lock — OverlayLock title + isolated seal at LOCK. */
export const OVERLAY_LOCK_TITLE_PX = 30;
export const OVERLAY_LOCK_LETTER = "0.02em";
export const OVERLAY_LOCK_WORD = "0.2em";

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
  // Speaker / context label
  // After talking-head, before captions
  const speaker = (name || "Teacher").trim();
  const context = (role || label || "").trim();
  if (!speaker) return null;
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
        {speaker}
      </div>
      {context ? (
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
          {context}
        </div>
      ) : null}
    </div>
  );
}

/** Karaoke line packing — Caption density. Six words per visible line. */
export const CAPTION_DENSITY_WORDS = 6;

export function packCaptionLines<T>(words: readonly T[], size = CAPTION_DENSITY_WORDS): T[][] {
  const packed: T[][] = [];
  for (let i = 0; i < words.length; i += size) {
    packed.push(words.slice(i, i + size));
  }
  return packed;
}

export function packedCaptionLine<T extends {state?: string}>(
  words: readonly T[],
  size = CAPTION_DENSITY_WORDS,
): T[] {
  const lines = packCaptionLines(words, size);
  if (lines.length === 0) return [];
  const active = lines.find((line) => line.some((word) => word.state === "active"));
  if (active) return active;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].some((word) => word.state === "spoken")) return lines[i];
  }
  return lines[0];
}

export function CaptionsBand({captions}: {captions: Caption[]}) {
  const frame = useCurrentFrame();
  const nowMs = (frame / 30) * 1000;
  const clock = useMemo(() => wordClock(captions, nowMs), [captions, nowMs]);
  const line = packedCaptionLine(clock.words);
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
      {line.map((word) => {
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

/** Lesson position signal. After letterbox, before audio. Five ORDER LOCK ticks. */
export const PROGRESS_RAIL_BEATS = ["sting", "slate", "objective", "recap", "next-up"] as const;
export type ProgressRailBeat = (typeof PROGRESS_RAIL_BEATS)[number];
export const PROGRESS_RAIL_H = 4;

export function ProgressRail({beat}: {beat: ProgressRailBeat}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: LETTERBOX_H + 12,
        height: PROGRESS_RAIL_H,
        display: "flex",
        gap: 8,
      }}
    >
      {PROGRESS_RAIL_BEATS.map((id) => (
        <div
          key={id}
          style={{
            flex: 1,
            height: PROGRESS_RAIL_H,
            backgroundColor: id === beat ? gold : ink,
            opacity: id === beat ? 1 : 0.18,
          }}
        />
      ))}
    </div>
  );
}

/** Beat label signal. After progress, before audio. ORDER LOCK chapter chip. */
export const CHAPTER_CHIP_LABELS: Record<ProgressRailBeat, string> = {
  sting: "Sting",
  slate: "Slate",
  objective: "Objective",
  recap: "Recap",
  "next-up": "Next up",
};

export function ChapterChip({beat}: {beat: ProgressRailBeat}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: LETTERBOX_H + 16,
        padding: "8px 16px 8px 14px",
        backgroundColor: cream,
        borderLeft: `4px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {CHAPTER_CHIP_LABELS[beat]}
      </div>
    </div>
  );
}

/** Tip / aside signal. After chapter, before audio. */
export const CALLOUT_CARD_COPY: Record<ProgressRailBeat, {kicker: string; line: string}> = {
  sting: {kicker: "Tip", line: "One idea per beat"},
  slate: {kicker: "Aside", line: "Head stays docked"},
  objective: {kicker: "Tip", line: "Type is the lesson"},
  recap: {kicker: "Aside", line: "Return the same claim"},
  "next-up": {kicker: "Tip", line: "Next beat, not a dump"},
};

export function CalloutCard({beat}: {beat: ProgressRailBeat}) {
  const {kicker, line} = CALLOUT_CARD_COPY[beat];
  return (
    <div
      style={{
        position: "absolute",
        right: 64,
        bottom: LETTERBOX_H + 28,
        maxWidth: 420,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `4px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {line}
      </div>
    </div>
  );
}

/** Beat-to-beat wipe. After callout, before audio. Cream luma + gold leading edge. */
export const TRANSITION_LUMA_FRAMES = 18;

export function TransitionLuma() {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, TRANSITION_LUMA_FRAMES], [1920, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (width <= 0) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: 1080,
        backgroundColor: cream,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 6,
          height: 1080,
          backgroundColor: gold,
        }}
      />
    </div>
  );
}

/** Thesis / claim lock. After sting/objective path, before practice. Cream + gold 6px rail. */
export const KEY_CLAIM_KICKER = "Thesis";
export const KEY_CLAIM_LINE = "Lock one claim.";

export function KeyClaim() {
  const words = KEY_CLAIM_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? KEY_CLAIM_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 28,
        maxWidth: 480,
        padding: "14px 22px 16px 18px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {KEY_CLAIM_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Verse / citation lock. After sting/objective path, after claim, before practice. Cream + gold 6px rail. */
export const SCRIPTURE_CARD_KICKER = "Verse";
export const SCRIPTURE_CARD_LINE = "Cite the verse.";

export function ScriptureCard() {
  const words = SCRIPTURE_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? SCRIPTURE_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 78,
        maxWidth: 480,
        padding: "14px 22px 16px 18px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {SCRIPTURE_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Two-claim / contrast. After sting/objective path, after scripture, before practice. Cream + gold 6px rail. */
export const COMPARE_BOARD_KICKER = "Compare";
export const COMPARE_BOARD_LINE = "Hold two claims.";
export const COMPARE_BOARD_LEFT = "Type holds.";
export const COMPARE_BOARD_RIGHT = "Head docks.";

export function CompareBoard() {
  const words = COMPARE_BOARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? COMPARE_BOARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  const leftWords = COMPARE_BOARD_LEFT.trim().split(/\s+/);
  const leftKeyword = leftWords[leftWords.length - 1] ?? COMPARE_BOARD_LEFT;
  const leftLead = leftWords.slice(0, -1).join(" ");
  const rightWords = COMPARE_BOARD_RIGHT.trim().split(/\s+/);
  const rightKeyword = rightWords[rightWords.length - 1] ?? COMPARE_BOARD_RIGHT;
  const rightLead = rightWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 178,
        width: 520,
        padding: "14px 22px 16px 18px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {COMPARE_BOARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div style={{marginTop: 10, display: "flex", flexDirection: "row", gap: 24}}>
        <div
          style={{
            flex: 1,
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          {leftLead ? `${leftLead} ` : null}
          <Keyword>{leftKeyword}</Keyword>
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          {rightLead ? `${rightLead} ` : null}
          <Keyword>{rightKeyword}</Keyword>
        </div>
      </div>
    </div>
  );
}

/** Section break / chapter title. After sting/objective path, after compare, before practice. Cream + gold 6px rail. */
export const SECTION_TITLE_KICKER = "Section";
export const SECTION_TITLE_LINE = "Name the section.";

export function SectionTitle() {
  const words = SECTION_TITLE_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? SECTION_TITLE_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 228,
        maxWidth: 480,
        padding: "14px 22px 16px 18px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {SECTION_TITLE_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Term / definition pop. After sting/objective path, after section, before practice. Cream + gold 6px rail. */
export const GLOSSARY_CHIP_KICKER = "Glossary";
export const GLOSSARY_CHIP_TERM = "Type";
export const GLOSSARY_CHIP_LINE = "Define the term.";

export function GlossaryChip() {
  const words = GLOSSARY_CHIP_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? GLOSSARY_CHIP_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 278,
        maxWidth: 420,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {GLOSSARY_CHIP_KICKER}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {GLOSSARY_CHIP_TERM}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Steelman / respond. After sting/objective path, after glossary, before practice. Cream + gold 6px rail. */
export const OBJECTION_CARD_KICKER = "Objection";
export const OBJECTION_CARD_LINE = "Steelman the reply.";

export function ObjectionCard() {
  const words = OBJECTION_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? OBJECTION_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 328,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {OBJECTION_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Cold open / hook. ORDER LOCK first beat, sting only. Cream + gold 6px rail. */
export const STING_COLD_OPEN_KICKER = "Cold open";
export const STING_COLD_OPEN_LINE = "Start on the hook.";

export function StingColdOpen() {
  const words = STING_COLD_OPEN_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? STING_COLD_OPEN_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 378,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {STING_COLD_OPEN_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Formative check / confirm-understanding. After sting/objective path, after objection, before practice. Cream + gold 6px rail. */
export const CHECKPOINT_CARD_KICKER = "Check";
export const CHECKPOINT_CARD_LINE = "Confirm the idea.";

export function CheckpointCard() {
  const words = CHECKPOINT_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? CHECKPOINT_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 428,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {CHECKPOINT_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Worked example / show-how. After sting/objective path, after checkpoint, before practice. Cream + gold 6px rail. */
export const EXAMPLE_CARD_KICKER = "Example";
export const EXAMPLE_CARD_LINE = "Show the work.";

export function ExampleCard() {
  const words = EXAMPLE_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? EXAMPLE_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 478,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {EXAMPLE_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Pull quote / authority cite. After sting/objective path, after example, before practice. Cream + gold 6px rail. */
export const QUOTE_CARD_KICKER = "Quote";
export const QUOTE_CARD_LINE = "Hold the quote.";

export function QuoteCard() {
  const words = QUOTE_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? QUOTE_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 528,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {QUOTE_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Numbered procedure / do-this-in-order. After sting/objective path, after quote, before practice. Cream + gold 6px rail. */
export const STEPS_CARD_KICKER = "Steps";
export const STEPS_CARD_LINE = "Do this in order.";
export const STEPS_CARD_ONE = "1. Name the beat.";
export const STEPS_CARD_TWO = "2. Do the work.";

export function StepsCard() {
  const words = STEPS_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? STEPS_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  const oneWords = STEPS_CARD_ONE.trim().split(/\s+/);
  const oneKeyword = oneWords[oneWords.length - 1] ?? STEPS_CARD_ONE;
  const oneLead = oneWords.slice(0, -1).join(" ");
  const twoWords = STEPS_CARD_TWO.trim().split(/\s+/);
  const twoKeyword = twoWords[twoWords.length - 1] ?? STEPS_CARD_TWO;
  const twoLead = twoWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 578,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {STEPS_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {oneLead ? `${oneLead} ` : null}
        <Keyword>{oneKeyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {twoLead ? `${twoLead} ` : null}
        <Keyword>{twoKeyword}</Keyword>
      </div>
    </div>
  );
}

/** Watch-out / warning. After sting/objective path, after steps, before practice. Cream + gold 6px rail. */
export const CAVEAT_CARD_KICKER = "Caveat";
export const CAVEAT_CARD_LINE = "Watch the catch.";

export function CaveatCard() {
  const words = CAVEAT_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? CAVEAT_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 628,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {CAVEAT_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Learner pause / think-then-answer. After sting/objective path, after caveat, before practice. Cream + gold 6px rail. */
export const REFLECTION_PROMPT_KICKER = "Reflect";
export const REFLECTION_PROMPT_LINE = "Think, then answer.";

export function ReflectionPrompt() {
  const words = REFLECTION_PROMPT_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? REFLECTION_PROMPT_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 678,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {REFLECTION_PROMPT_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Sequence of beats / ordered milestones. After sting/objective path, after reflect, before practice. Cream + gold 6px rail. */
export const TIMELINE_RAIL_KICKER = "Timeline";
export const TIMELINE_RAIL_LINE = "Mark the beats.";
export const TIMELINE_RAIL_ONE = "1. Open first.";
export const TIMELINE_RAIL_TWO = "2. Close last.";

export function TimelineRail() {
  const words = TIMELINE_RAIL_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? TIMELINE_RAIL_LINE;
  const lead = words.slice(0, -1).join(" ");
  const oneWords = TIMELINE_RAIL_ONE.trim().split(/\s+/);
  const oneKeyword = oneWords[oneWords.length - 1] ?? TIMELINE_RAIL_ONE;
  const oneLead = oneWords.slice(0, -1).join(" ");
  const twoWords = TIMELINE_RAIL_TWO.trim().split(/\s+/);
  const twoKeyword = twoWords[twoWords.length - 1] ?? TIMELINE_RAIL_TWO;
  const twoLead = twoWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 728,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {TIMELINE_RAIL_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {oneLead ? `${oneLead} ` : null}
        <Keyword>{oneKeyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {twoLead ? `${twoLead} ` : null}
        <Keyword>{twoKeyword}</Keyword>
      </div>
    </div>
  );
}

/** Citation chip distinct from quote / verse. After sting/objective path, after timeline, before practice. Cream + gold 6px rail. */
export const SOURCE_CHIP_KICKER = "Source";
export const SOURCE_CHIP_CITE = "Field";
export const SOURCE_CHIP_LINE = "Name the source.";

export function SourceChip() {
  const words = SOURCE_CHIP_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? SOURCE_CHIP_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 778,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {SOURCE_CHIP_KICKER}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {SOURCE_CHIP_CITE}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Continuum / contrast bar distinct from compare. After sting/objective path, after source, before practice. Cream + gold 6px rail. */
export const SPECTRUM_BAR_KICKER = "Spectrum";
export const SPECTRUM_BAR_LINE = "Hold the range.";
export const SPECTRUM_BAR_LOW = "Low.";
export const SPECTRUM_BAR_HIGH = "High.";

export function SpectrumBar() {
  const words = SPECTRUM_BAR_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? SPECTRUM_BAR_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 828,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {SPECTRUM_BAR_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          <Keyword>{SPECTRUM_BAR_LOW}</Keyword>
        </div>
        <div
          style={{
            flex: 1,
            height: 6,
            backgroundColor: gold,
          }}
        />
        <div
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          <Keyword>{SPECTRUM_BAR_HIGH}</Keyword>
        </div>
      </div>
    </div>
  );
}

/** Cutoff / gate mark distinct from continuum. After sting/objective path, after spectrum, before practice. Cream + gold 6px rail. */
export const THRESHOLD_CARD_KICKER = "Threshold";
export const THRESHOLD_CARD_LINE = "Mark the cutoff.";
export const THRESHOLD_CARD_MARK = "Here.";

export function ThresholdCard() {
  const words = THRESHOLD_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? THRESHOLD_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 878,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {THRESHOLD_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div style={{marginTop: 8}}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 18,
          }}
        >
          <div
            style={{
              flex: 58,
              height: 4,
              backgroundColor: ink,
              opacity: 0.18,
            }}
          />
          <div
            style={{
              width: 4,
              height: 18,
              backgroundColor: gold,
            }}
          />
          <div
            style={{
              flex: 42,
              height: 4,
              backgroundColor: ink,
              opacity: 0.18,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          <Keyword>{THRESHOLD_CARD_MARK}</Keyword>
        </div>
      </div>
    </div>
  );
}

/** Scoring bands / criteria distinct from cutoff. After sting/objective path, after threshold, before practice. Cream + gold 6px rail. */
export const RUBRIC_CARD_KICKER = "Rubric";
export const RUBRIC_CARD_LINE = "Score the bands.";
export const RUBRIC_CARD_ONE = "A. Holds.";
export const RUBRIC_CARD_TWO = "B. Misses.";

export function RubricCard() {
  const words = RUBRIC_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? RUBRIC_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  const oneWords = RUBRIC_CARD_ONE.trim().split(/\s+/);
  const oneKeyword = oneWords[oneWords.length - 1] ?? RUBRIC_CARD_ONE;
  const oneLead = oneWords.slice(0, -1).join(" ");
  const twoWords = RUBRIC_CARD_TWO.trim().split(/\s+/);
  const twoKeyword = twoWords[twoWords.length - 1] ?? RUBRIC_CARD_TWO;
  const twoLead = twoWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 928,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {RUBRIC_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 4,
            height: 16,
            backgroundColor: gold,
          }}
        />
        <div
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          {oneLead ? `${oneLead} ` : null}
          <Keyword>{oneKeyword}</Keyword>
        </div>
      </div>
      <div
        style={{
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 4,
            height: 16,
            backgroundColor: gold,
          }}
        />
        <div
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          {twoLead ? `${twoLead} ` : null}
          <Keyword>{twoKeyword}</Keyword>
        </div>
      </div>
    </div>
  );
}

/** Evidence / warrant rows distinct from bands and citation. After sting/objective path, after rubric, before practice. Cream + gold 6px rail. */
export const EVIDENCE_CARD_KICKER = "Evidence";
export const EVIDENCE_CARD_LINE = "Hold the warrant.";
export const EVIDENCE_CARD_ONE = "The fact holds.";
export const EVIDENCE_CARD_TWO = "The why shows.";

export function EvidenceCard() {
  const words = EVIDENCE_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? EVIDENCE_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  const oneWords = EVIDENCE_CARD_ONE.trim().split(/\s+/);
  const oneKeyword = oneWords[oneWords.length - 1] ?? EVIDENCE_CARD_ONE;
  const oneLead = oneWords.slice(0, -1).join(" ");
  const twoWords = EVIDENCE_CARD_TWO.trim().split(/\s+/);
  const twoKeyword = twoWords[twoWords.length - 1] ?? EVIDENCE_CARD_TWO;
  const twoLead = twoWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 978,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {EVIDENCE_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            backgroundColor: gold,
          }}
        />
        <div
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          {oneLead ? `${oneLead} ` : null}
          <Keyword>{oneKeyword}</Keyword>
        </div>
      </div>
      <div
        style={{
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            backgroundColor: gold,
          }}
        />
        <div
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 22,
            color: ink,
          }}
        >
          {twoLead ? `${twoLead} ` : null}
          <Keyword>{twoKeyword}</Keyword>
        </div>
      </div>
    </div>
  );
}

/** Analogy / like-this transfer pair distinct from two claims and show-the-work. After sting/objective path, after evidence, before practice. Cream + gold 6px rail. */
export const ANALOGY_CARD_KICKER = "Analogy";
export const ANALOGY_CARD_LINE = "Map like this.";
export const ANALOGY_CARD_ONE = "Like a seed.";
export const ANALOGY_CARD_TWO = "So a type.";

export function AnalogyCard() {
  const words = ANALOGY_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? ANALOGY_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  const oneWords = ANALOGY_CARD_ONE.trim().split(/\s+/);
  const oneKeyword = oneWords[oneWords.length - 1] ?? ANALOGY_CARD_ONE;
  const oneLead = oneWords.slice(0, -1).join(" ");
  const twoWords = ANALOGY_CARD_TWO.trim().split(/\s+/);
  const twoKeyword = twoWords[twoWords.length - 1] ?? ANALOGY_CARD_TWO;
  const twoLead = twoWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 220,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {ANALOGY_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {oneLead ? `${oneLead} ` : null}
        <Keyword>{oneKeyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 6,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 18,
            height: 2,
            backgroundColor: gold,
          }}
        />
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderLeft: `10px solid ${gold}`,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {twoLead ? `${twoLead} ` : null}
        <Keyword>{twoKeyword}</Keyword>
      </div>
    </div>
  );
}

/** Counterexample / not-this foil distinct from show-the-work and like-this transfer. After sting/objective path, after analogy, before practice. Cream + gold 6px rail. */
export const COUNTEREXAMPLE_CARD_KICKER = "Foil";
export const COUNTEREXAMPLE_CARD_LINE = "Name what is not.";
export const COUNTEREXAMPLE_CARD_ONE = "Not this case.";
export const COUNTEREXAMPLE_CARD_TWO = "A miss.";

export function CounterexampleCard() {
  const words = COUNTEREXAMPLE_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? COUNTEREXAMPLE_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  const oneWords = COUNTEREXAMPLE_CARD_ONE.trim().split(/\s+/);
  const oneKeyword = oneWords[oneWords.length - 1] ?? COUNTEREXAMPLE_CARD_ONE;
  const oneLead = oneWords.slice(0, -1).join(" ");
  const twoWords = COUNTEREXAMPLE_CARD_TWO.trim().split(/\s+/);
  const twoKeyword = twoWords[twoWords.length - 1] ?? COUNTEREXAMPLE_CARD_TWO;
  const twoLead = twoWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 320,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {COUNTEREXAMPLE_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {oneLead ? `${oneLead} ` : null}
        <Keyword>{oneKeyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 6,
          position: "relative",
          width: 18,
          height: 18,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            border: `2px solid ${gold}`,
            borderRadius: 16,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            width: 18,
            height: 2,
            backgroundColor: gold,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {twoLead ? `${twoLead} ` : null}
        <Keyword>{twoKeyword}</Keyword>
      </div>
    </div>
  );
}

/** Repair / the case that holds, distinct from the not-this foil and try-this practice. After sting/objective path, after counterexample, before practice. Cream + gold 6px rail. */
export const REPAIR_CARD_KICKER = "Repair";
export const REPAIR_CARD_LINE = "Name the case that holds.";
export const REPAIR_CARD_ONE = "This case.";
export const REPAIR_CARD_TWO = "A fit.";

export function RepairCard() {
  const words = REPAIR_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? REPAIR_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  const oneWords = REPAIR_CARD_ONE.trim().split(/\s+/);
  const oneKeyword = oneWords[oneWords.length - 1] ?? REPAIR_CARD_ONE;
  const oneLead = oneWords.slice(0, -1).join(" ");
  const twoWords = REPAIR_CARD_TWO.trim().split(/\s+/);
  const twoKeyword = twoWords[twoWords.length - 1] ?? REPAIR_CARD_TWO;
  const twoLead = twoWords.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 210,
        maxWidth: 400,
        padding: "12px 20px 14px 16px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {REPAIR_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {oneLead ? `${oneLead} ` : null}
        <Keyword>{oneKeyword}</Keyword>
      </div>
      <div
        style={{
          marginTop: 6,
          width: 16,
          height: 16,
          backgroundColor: gold,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        {twoLead ? `${twoLead} ` : null}
        <Keyword>{twoKeyword}</Keyword>
      </div>
    </div>
  );
}

/** Application / try-this. After Recap/Quiz path, before end. Cream + gold 6px rail. */
export const PRACTICE_CARD_KICKER = "Try this";
export const PRACTICE_CARD_LINE = "Apply one idea now.";

export function PracticeCard() {
  const words = PRACTICE_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? PRACTICE_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 128,
        maxWidth: 480,
        padding: "14px 22px 16px 18px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {PRACTICE_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
  );
}

/** Lesson close signal. After QuizBumper/next-up, before audio. Cream + gold 6px rail. */
export const END_CARD_KICKER = "Close";
export const END_CARD_LINE = "The lesson holds.";

export function EndCard() {
  const words = END_CARD_LINE.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? END_CARD_LINE;
  const lead = words.slice(0, -1).join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: LETTERBOX_H + 28,
        maxWidth: 480,
        padding: "14px 22px 16px 18px",
        backgroundColor: cream,
        borderLeft: `6px solid ${gold}`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {END_CARD_KICKER}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: ink,
        }}
      >
        {lead ? `${lead} ` : null}
        <Keyword>{keyword}</Keyword>
      </div>
    </div>
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
