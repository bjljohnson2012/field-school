import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VIDEO_ID } from "@/lib/course/types";
import { youtubeEmbedUrlFor, youtubeWatchUrlFor } from "@/lib/course/youtube";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimecode(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function youtubeWatchUrl(start?: number, videoId = VIDEO_ID) {
  return youtubeWatchUrlFor(videoId, start);
}

export function youtubeEmbedUrl(start?: number, end?: number, videoId = VIDEO_ID) {
  return youtubeEmbedUrlFor(videoId, start, end);
}
