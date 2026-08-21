import { formatTimecode } from "@/lib/utils";
import { VIDEO_ID, VIDEO_TITLE } from "@/lib/course/types";
import { youtubeEmbedUrlFor } from "@/lib/course/youtube";

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
  // Embed the player inline by default — no "Watch on YouTube" hop. The clip
  // start/end are baked into the embed URL so it plays the right window in place.
  const src = youtubeEmbedUrlFor(videoId, start, end);
  const range =
    start != null && end != null
      ? `${formatTimecode(start)} – ${formatTimecode(end)}`
      : full
        ? "Full tape"
        : null;

  return (
    <figure className="md-card overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-video bg-raised">
        <iframe
          title={label}
          src={src}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption className="px-4 py-3">
        <p className="font-medium text-fg">{label}</p>
        <p className="text-sm text-muted">
          {range ? `${range} · ` : null}
          {why ?? VIDEO_TITLE}
        </p>
      </figcaption>
    </figure>
  );
}
