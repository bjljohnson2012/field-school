"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLessonSpineContinue, useLessonSpinePlayWrite } from "@/components/lesson-spine-play-write";
import {
  LESSON_SPINE_CHAPTERS,
  LESSON_SPINE_DURATION_SEC,
  LESSON_SPINE_MASTER_SHA256,
} from "@/lib/player/lesson-spine-meta";

export function LessonSpinePlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { recordPlay, wrote } = useLessonSpinePlayWrite();
  const continueAt = useLessonSpineContinue();
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
    if (continued.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 1) return;
    continued.current = true;
    video.currentTime = continueAt.startSec;
  }, [continueAt]);

  return (
    <div className="space-y-4" data-player="lesson-spine" data-play-write={wrote ? "living-brain" : undefined}>
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
            seek(continueAt.startSec);
          }}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onPlay={() => {
            setPlaying(true);
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
