import { parseYoutubeId, youtubeEmbedUrlFor, youtubeWatchUrlFor } from "./youtube";

export type VideoProvider = "youtube" | "loom" | "x" | "none";

export interface VideoSource {
  provider: VideoProvider;
  /** Provider-specific id: YouTube video id, Loom share id, or X status id. */
  id: string;
  /** Canonical watch URL ("" when there's no video). */
  url: string;
  /** iframe src for providers that embed via iframe (youtube, loom); "" otherwise. */
  embedUrl: string;
}

const NONE: VideoSource = { provider: "none", id: "", url: "", embedUrl: "" };

function parseLoomId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "loom.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "share" || p === "embed");
    const id = idx >= 0 ? parts[idx + 1] : parts[0];
    return id && /^[a-zA-Z0-9]{16,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function parseXId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "x.com" && host !== "twitter.com" && host !== "mobile.x.com") {
      return null;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("status");
    const id = idx >= 0 ? parts[idx + 1] : undefined;
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Detect the video provider from a URL (or a bare 11-char YouTube id) and
 * produce the canonical watch URL + iframe embed URL. Supports YouTube, Loom,
 * and X (Twitter). `start`/`end` (seconds) apply to YouTube/Loom only.
 */
export function detectVideo(
  input: string | null | undefined,
  start?: number,
  end?: number,
): VideoSource {
  const value = (input ?? "").trim();
  if (!value) return NONE;

  const yt = parseYoutubeId(value);
  if (yt) {
    return {
      provider: "youtube",
      id: yt,
      url: youtubeWatchUrlFor(yt, start),
      embedUrl: youtubeEmbedUrlFor(yt, start, end),
    };
  }

  const loom = parseLoomId(value);
  if (loom) {
    const embed = `https://www.loom.com/embed/${loom}`;
    return {
      provider: "loom",
      id: loom,
      url: `https://www.loom.com/share/${loom}`,
      embedUrl:
        start != null ? `${embed}?t=${Math.max(0, Math.floor(start))}` : embed,
    };
  }

  const x = parseXId(value);
  if (x) {
    return {
      provider: "x",
      id: x,
      url: `https://x.com/i/status/${x}`,
      embedUrl: "",
    };
  }

  return NONE;
}

/** True when the string points at a video we know how to embed. */
export function isEmbeddableVideo(input: string | null | undefined): boolean {
  return detectVideo(input).provider !== "none";
}
