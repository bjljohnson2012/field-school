"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import Link from "next/link";
import { useLessonSpineContinue, useLessonSpinePlayWrite, useLessonSpineRail } from "@/components/lesson-spine-play-write";
import { lessonSpineTeachProve } from "@/lib/player/play-rail-write";

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

function BeatCard({ label, index, total }: { label: string; index: number; total: number }) {
  const frame = useCurrentFrame();
  const chapter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
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
          opacity: interpolate(frame, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0, 12], ["0px 16px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          borderLeft: "6px solid #C4A35A",
          paddingLeft: 28,
          maxWidth: 1040,
        }}
      >
        <p style={{ fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>
          LessonSpine · {chapter}
        </p>
        <h2 style={{ fontSize: 72, lineHeight: 1.05, margin: "12px 0 0" }}>{label}</h2>
        <p style={{ fontSize: 24, margin: "16px 0 0" }}>
          Household: the child has no login. Sales: this desk lists no children.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 48,
          opacity: interpolate(frame, [6, 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p
          data-caption={label}
          style={{
            margin: 0,
            fontSize: 22,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#1A1A16",
            borderTop: "2px solid #C4A35A",
            paddingTop: 12,
          }}
        >
          {label}
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
          <BeatCard label={row.label} index={ROWS.indexOf(row)} total={ROWS.length} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function frameFor(chapterId: string) {
  const id = chapterId === "next-up" ? "nextUp" : chapterId;
  return ROWS.find((row) => row.id === id)?.from ?? 0;
}

function chapterAt(frame: number) {
  return [...ROWS].reverse().find((row) => frame >= row.from) ?? ROWS[0];
}

export function LessonSpineRemotionPreview() {
  const playerRef = useRef<PlayerRef>(null);
  const { recordPlay, recordResume, recordPortion, recordProve, recordRail, wrote } = useLessonSpinePlayWrite();
  const continueAt = useLessonSpineContinue();
  const rail = useLessonSpineRail();
  const playing = useRef(false);
  const prevIndex = useRef<number | null>(null);
  const portionSeen = useRef(new Set<string>());
  const [frame, setFrame] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const restoredId = continueAt
    ? continueAt.chapterId === "next-up"
      ? "nextUp"
      : continueAt.chapterId
    : null;
  const chapter = ROWS.find((row) => row.id === (chosen ?? restoredId)) ?? chapterAt(frame);
  const opened = continueAt ? lessonSpineTeachProve(continueAt.step) : null;

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (continueAt?.step) {
      const freshNextLesson = continueAt.label === "Next lesson" && !continueAt.offsetSec && !continueAt.cue;
      const next = freshNextLesson
        ? 0
        : frameFor(continueAt.chapterId) + Math.round((continueAt.offsetSec || 0) * FPS);
      player.seekTo(next);
      setFrame(next);
    }
    const onPlay = () => {
      playing.current = true;
      sessionStorage.setItem("fs-lesson-spine-active-rail", "remotion");
      void recordRail("remotion");
      if (!continueAt) void recordPlay("sting");
      else void recordPlay(continueAt.chapterId);
    };
    const onFrame = () => {
      const next = player.getCurrentFrame();
      setFrame(next);
      if (continueAt && next === 0 && frameFor(continueAt.chapterId) !== 0) return;
      setChosen(chapterAt(next).id);
      if (!playing.current) return;
      const row = chapterAt(next);
      const index = ROWS.findIndex((item) => item.id === row.id);
      if (prevIndex.current === null) {
        prevIndex.current = index;
      } else if (index > prevIndex.current) {
        for (let i = prevIndex.current; i < index; i += 1) {
          const id = ROWS[i].id;
          if (portionSeen.current.has(id)) continue;
          portionSeen.current.add(id);
          void recordPortion(id);
        }
        prevIndex.current = index;
      }
      const last = ROWS[ROWS.length - 1];
      if (row.id === last.id && next >= last.from + last.frames - 1 && !portionSeen.current.has(last.id)) {
        portionSeen.current.add(last.id);
        void recordPortion(last.id);
      }
    };
    const saveResume = (next: number) => {
      const row = chapterAt(next);
      const restored = continueAt
        ? continueAt.chapterId === "next-up"
          ? "nextUp"
          : continueAt.chapterId
        : null;
      if (!restored || row.id !== restored) return;
      const offsetSec = (next - row.from) / FPS;
      if (offsetSec <= 0) return;
      const cue = `${row.label}. Household: the child has no login. Sales: this desk lists no children.`;
      void recordResume(offsetSec, cue);
    };
    const markRemotion = () => sessionStorage.setItem("fs-lesson-spine-active-rail", "remotion");
    const onSeeked = () => {
      markRemotion();
      saveResume(player.getCurrentFrame());
    };
    const onPause = () => {
      playing.current = false;
      markRemotion();
      saveResume(player.getCurrentFrame());
    };
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onSeeked);
    const onLeave = () => {
      if (document.visibilityState === "hidden") saveResume(player.getCurrentFrame());
    };
    const onHardExit = () => {
      if (sessionStorage.getItem("fs-lesson-spine-active-rail") === "html5") return;
      saveResume(player.getCurrentFrame());
    };
    document.addEventListener("visibilitychange", onLeave);
    window.addEventListener("pagehide", onHardExit);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onSeeked);
      document.removeEventListener("visibilitychange", onLeave);
      window.removeEventListener("pagehide", onHardExit);
    };
  }, [continueAt, recordPlay, recordPortion, recordRail, recordResume]);

  return (
    <section
      className="mt-8"
      data-remotion-player="lesson-spine"
      data-composition="LessonSpine"
      data-rooms="household,sales"
      data-login="none"
      data-sales-children="0"
      data-play-rail={rail === "remotion" ? "remotion" : undefined}
      data-play-write={wrote ? "living-brain" : undefined}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Remotion preview</p>
      {continueAt && opened ? (
        <>
          <p
            className="mt-2 text-sm text-muted-foreground"
            data-continue-from="outcomes"
            data-lesson-spine-next={continueAt.step}
            data-login={continueAt.login}
            data-sales-children={continueAt.room === "sales" ? "0" : undefined}
          >
            Continue · {continueAt.step}
          </p>
          <div
            className="mt-3 flex flex-wrap items-center gap-3 text-sm"
            data-consume-portion="living-brain"
            data-next-lesson={opened.label === "Next lesson" ? "living-brain" : undefined}
            data-lesson-spine-next={opened.step}
            data-continue-chapter={opened.chapterId}
            data-login={continueAt.login}
            data-sales-children={continueAt.room === "sales" ? "0" : undefined}
            data-portion-stage={continueAt.stage === "teach" ? "teach" : "assign"}
          >
            {continueAt.stage === "teach" ? null : (
              <Link
                href="/assign"
                className="underline underline-offset-2"
                data-assign-portion={opened.assign}
                data-assign-chapter={opened.chapterId}
              >
                Assign · {opened.label}
              </Link>
            )}
            <Link
              href="/teach-live"
              className="underline underline-offset-2"
              data-teach-portion={opened.teach}
              data-teach-chapter={opened.chapterId}
              data-teach-entry={continueAt.stage === "teach" ? "living-brain" : undefined}
            >
              Teach · {opened.label}
            </Link>
            <a
              href="#lesson-spine-prove"
              className="underline underline-offset-2"
              data-prove-portion={opened.prove}
              data-prove-chapter={opened.chapterId}
            >
              Prove · {opened.label}
            </a>
            <button
              type="button"
              className="underline underline-offset-2"
              data-prove-complete="living-brain"
              data-prove-complete-chapter={opened.chapterId}
              onClick={() => {
                void recordProve(opened.chapterId);
              }}
            >
              Prove complete
            </button>
            <span>
              {continueAt.login === "none"
                ? "The child has no login."
                : "This desk lists no children."}
            </span>
          </div>
        </>
      ) : null}
      <h2 className="mt-1 font-display text-2xl tracking-tight">LessonSpine composition</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Same beat clock as the factory composition: sting, slate, objective, recap, next up. The HTML5 rail above
        still plays the locked master. This preview does not take a Cap and does not write a master.
      </p>
      <p
        className="mt-4 text-sm"
        data-chapter-label={chapter.label}
        data-preview-craft="chapter"
        data-continue-from={!chosen && continueAt ? "outcomes" : undefined}
        data-continue-chapter={!chosen && continueAt ? continueAt.chapterId : undefined}
      >
        {ROWS.findIndex((row) => row.id === chapter.id) + 1} / {ROWS.length} · {chapter.label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2" data-chapter-rail="lesson-spine">
        {ROWS.map((row) => (
          <button
            key={row.id}
            type="button"
            className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.12em]"
            data-chapter={row.id}
            data-chapter-current={row.id === chapter.id ? "yes" : "no"}
            onClick={() => {
              setChosen(row.id);
              playerRef.current?.seekTo(row.from);
              setFrame(row.from);
            }}
          >
            {row.label}
          </button>
        ))}
      </div>
      <p
        className="mt-2 text-sm text-muted-foreground"
        data-preview-caption={chapter.id}
        data-next-lesson={!chosen && continueAt?.label === "Next lesson" ? "living-brain" : undefined}
        data-continue-from={!chosen && continueAt ? "outcomes" : undefined}
        data-resume-cue={!chosen && continueAt?.cue ? continueAt.cue : undefined}
        data-resume-sec={!chosen && continueAt?.offsetSec ? continueAt.offsetSec : undefined}
      >
        {!chosen && continueAt?.cue
          ? continueAt.cue
          : `${!chosen && continueAt?.label === "Next lesson" ? "Next lesson" : chapter.label}. Household: the child has no login. Sales: this desk lists no children.`}
      </p>
      <div id="lesson-spine-prove" className="mt-4 overflow-hidden rounded-2xl border border-border bg-black">
        <Player
          ref={playerRef}
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
