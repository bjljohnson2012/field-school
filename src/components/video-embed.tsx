import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { formatTimecode } from "@/lib/utils";
import { VIDEO_TITLE } from "@/lib/course/types";
import { detectVideo } from "@/lib/course/video";

type TwttrWidgets = {
  widgets?: {
    createTweet: (
      id: string,
      el: HTMLElement,
      opts?: Record<string, unknown>,
    ) => Promise<HTMLElement | undefined>;
  };
};

const X_SCRIPT = "https://platform.twitter.com/widgets.js";

function loadXWidgets(): Promise<TwttrWidgets | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const w = window as unknown as { twttr?: TwttrWidgets };
  if (w.twttr?.widgets) return Promise.resolve(w.twttr);
  return new Promise((resolve) => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${X_SCRIPT}"]`,
    );
    const done = () => resolve((window as unknown as { twttr?: TwttrWidgets }).twttr ?? null);
    if (!script) {
      script = document.createElement("script");
      script.src = X_SCRIPT;
      script.async = true;
      script.addEventListener("load", done);
      script.addEventListener("error", () => resolve(null));
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", done);
      // Already loaded case:
      if (w.twttr?.widgets) done();
    }
    // Safety timeout so a blocked script doesn't hang the tile forever.
    window.setTimeout(done, 4000);
  });
}

function XTweet({ id, url }: { id: string; url: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadXWidgets().then((twttr) => {
      if (cancelled) return;
      const el = host.current;
      if (!el || !twttr?.widgets) {
        setFailed(true);
        return;
      }
      el.replaceChildren();
      twttr.widgets
        .createTweet(id, el, { align: "center", conversation: "none" })
        .then((node) => {
          if (!node && !cancelled) setFailed(true);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex justify-center px-2 py-3">
      <div ref={host} className="w-full max-w-xl" />
      {failed ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="md-interactive inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          <ExternalLink className="size-4" />
          View on X
        </a>
      ) : null}
    </div>
  );
}

/**
 * Provider-agnostic video tile. Accepts a URL (YouTube, Loom, or X) or a bare
 * YouTube id, and embeds it inline: iframe for YouTube/Loom, native tweet embed
 * for X. `start`/`end` (seconds) apply to YouTube/Loom.
 */
export function VideoEmbed({
  url,
  videoId,
  start,
  end,
  label,
  why,
  full = false,
}: {
  url?: string;
  videoId?: string;
  start?: number;
  end?: number;
  label: string;
  why?: string;
  full?: boolean;
}) {
  const source = detectVideo(url ?? videoId ?? "", start, end);
  const range =
    start != null && end != null
      ? `${formatTimecode(start)} – ${formatTimecode(end)}`
      : full
        ? "Full tape"
        : null;

  return (
    <figure className="md-card overflow-hidden rounded-xl border border-border bg-surface">
      {source.provider === "youtube" || source.provider === "loom" ? (
        <div className="relative aspect-video bg-raised">
          <iframe
            title={label}
            src={source.embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : source.provider === "x" ? (
        <XTweet id={source.id} url={source.url} />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-raised px-4 text-center text-sm text-muted">
          No video yet. Add a YouTube, Loom, or X link in the office.
        </div>
      )}
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
