"use client";

import { ExternalLink, Play } from "lucide-react";
import { useState } from "react";
import { formatTimecode } from "@/lib/utils";
import { VIDEO_ID, VIDEO_TITLE } from "@/lib/course/types";
import {
  youtubeEmbedUrlFor,
  youtubePoster,
  youtubeWatchUrlFor,
} from "@/lib/course/youtube";

export function YoutubeClip({
  videoId = VIDEO_ID,
  start,
  end,
  label,
  why,
  full = false,
}: {
  videoId?: string;
  start?: number;
  end?: number;
  label: string;
  why?: string;
  full?: boolean;
}) {
  const [inline, setInline] = useState(false);
  const src = youtubeEmbedUrlFor(videoId, start, end);
  const watch = youtubeWatchUrlFor(videoId, start);
  const range =
    start != null && end != null
      ? `${formatTimecode(start)} – ${formatTimecode(end)}`
      : full
        ? "Full tape"
        : null;

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-video bg-secondary">
        {inline ? (
          <iframe
            title={label}
            src={`${src}&autoplay=1`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubePoster(videoId)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-background/55" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              <a
                href={watch}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                <Play className="size-4" />
                Watch on YouTube
              </a>
              <button
                type="button"
                onClick={() => setInline(true)}
                className="h-11 text-sm text-foreground underline-offset-4 hover:underline"
              >
                Try inline player
              </button>
              {range ? (
                <p className="font-mono text-xs text-muted-foreground">{range}</p>
              ) : null}
            </div>
          </>
        )}
      </div>
      <figcaption className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {range ? `${range} · ` : null}
            {why ?? VIDEO_TITLE}
          </p>
        </div>
        <a
          href={watch}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-4" />
          Open clip
        </a>
      </figcaption>
    </figure>
  );
}
