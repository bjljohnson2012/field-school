"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLessonSpineContinue, useLessonSpinePlayWrite, useLessonSpineRail } from "@/components/lesson-spine-play-write";
import {
  LESSON_SPINE_CHAPTERS,
  LESSON_SPINE_DURATION_SEC,
  LESSON_SPINE_MASTER_SHA256,
} from "@/lib/player/lesson-spine-meta";

export function LessonSpinePlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { recordPlay, recordRail, recordResume, wrote } = useLessonSpinePlayWrite();
  const continueAt = useLessonSpineContinue();
  const rail = useLessonSpineRail();
  const continued = useRef(false);
  const progress = Math.min(1, current / LESSON_SPINE_DURATION_SEC);
  const active = useMemo(
    () =>
      LESSON_SPINE_CHAPTERS.find((chapter) => current >= chapter.startSec && current < chapter.endSec) ??
      LESSON_SPINE_CHAPTERS[LESSON_SPINE_CHAPTERS.length - 1],
    [current],
  );

  function seek(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    setCurrent(seconds);
  }

  useEffect(() => {
    if (!continueAt) return;
    setCurrent(continueAt.startSec);
    const at = continueAt.startSec + (continueAt.offsetSec || 0);
    if (continued.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 1) return;
    continued.current = true;
    video.currentTime = at;
    setCurrent(at);
  }, [continueAt]);

  useEffect(() => {
    const video = videoRef.current;
    const saveResume = () => {
      if (!video || !continueAt) return;
      const time = video.currentTime;
      const chapter =
        LESSON_SPINE_CHAPTERS.find((row) => time >= row.startSec && time < row.endSec) ?? null;
      if (!chapter || chapter.id !== continueAt.chapterId) return;
      const offsetSec = time - chapter.startSec;
      if (offsetSec <= 0) return;
      const cue = `${chapter.label}. Household: the child has no login. Sales: this desk lists no children.`;
      void recordResume(offsetSec, cue);
    };
    const mark = () => sessionStorage.setItem("fs-lesson-spine-active-rail", "html5");
    const onSeeked = () => {
      mark();
      saveResume();
    };
    const onPause = () => {
      mark();
      saveResume();
    };
    const onHardExit = () => {
      if (sessionStorage.getItem("fs-lesson-spine-active-rail") !== "html5") return;
      saveResume();
    };
    video?.addEventListener("seeked", onSeeked);
    video?.addEventListener("pause", onPause);
    window.addEventListener("pagehide", onHardExit);
    return () => {
      video?.removeEventListener("seeked", onSeeked);
      video?.removeEventListener("pause", onPause);
      window.removeEventListener("pagehide", onHardExit);
    };
  }, [continueAt, recordResume]);

  return (
    <div
      className="space-y-4"
      data-player="lesson-spine"
      data-play-rail={rail === "html5" ? "html5" : undefined}
      data-play-write={wrote ? "living-brain" : undefined}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full"
          controls
          playsInline
          preload="metadata"
          src="/api/media/lesson-spine"
          data-master-sha256={LESSON_SPINE_MASTER_SHA256}
          data-ready="hls"
          onLoadedMetadata={() => {
            if (!continueAt || continued.current) return;
            continued.current = true;
            seek(continueAt.startSec + (continueAt.offsetSec || 0));
          }}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onPlay={() => {
            setPlaying(true);
            sessionStorage.setItem("fs-lesson-spine-active-rail", "html5");
            void recordRail("html5");
            void recordPlay(active.id);
          }}
          onPause={() => setPlaying(false)}
        >
          <source src="/lessons/hls/LessonSpine.m3u8" type="application/vnd.apple.mpegurl" />
          <source src="/api/media/lesson-spine" type="video/mp4" />
          <source src="/lessons/LessonSpine.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          <span>Player rail</span>
          {continueAt ? (
            <span
              data-continue-from="outcomes"
              data-lesson-spine-next={continueAt.step}
              data-login={continueAt.login}
              data-sales-children={continueAt.room === "sales" ? "0" : undefined}
            >
              Continue · {continueAt.step}
            </span>
          ) : null}
          <span data-ready-chip="hls">Ready · HLS</span>
          <span>
            {playing ? "Playing" : "Paused"} · {active.label}
          </span>
        </div>
        <div className="relative mt-4 h-2 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#C4A35A]"
            style={{ width: `${progress * 100}%` }}
          />
          {LESSON_SPINE_CHAPTERS.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              aria-label={`Jump to ${chapter.label}`}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#C4A35A] bg-[#EFE7D6]"
              style={{ left: `${(chapter.startSec / LESSON_SPINE_DURATION_SEC) * 100}%` }}
              onClick={() => seek(chapter.startSec)}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {LESSON_SPINE_CHAPTERS.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              onClick={() => seek(chapter.startSec)}
              className={`rounded-xl border px-3 py-2 text-left text-sm ${
                active.id === chapter.id
                  ? "border-[#C4A35A] bg-[#EFE7D6] text-[#1A1A16]"
                  : "border-border text-muted-foreground"
              }`}
            >
              <span className="block text-[11px] uppercase tracking-[0.14em]">{chapter.label}</span>
              <span className="mt-1 block text-xs">
                {chapter.startSec}s–{chapter.endSec}s
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Opens the last-used play rail from the living brain. HTML5 stays first until a Remotion play is stored. */
export function LessonSpineRailHydrate(props: { html5: ReactNode; preview: ReactNode }) {
  const rail = useLessonSpineRail();
  return (
    <div data-play-rail="living-brain" data-restored-rail={rail || undefined}>
      {rail === "remotion" ? (
        <>
          {props.preview}
          {props.html5}
        </>
      ) : (
        <>
          {props.html5}
          {props.preview}
        </>
      )}
    </div>
  );
}
