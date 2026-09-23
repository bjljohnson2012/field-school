/**
 * Search and cache Pexels video b-roll.
 * Authorization is the raw PEXELS_API_KEY. No Bearer prefix is sent.
 * Each cached file keeps a photographer attribution sidecar.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SEARCH_URL = "https://api.pexels.com/videos/search";

export function pexelsAuthorization(apiKey = process.env.PEXELS_API_KEY) {
  const raw = String(apiKey ?? "").trim().replace(/^Bearer\s+/i, "");
  if (!raw) throw new Error("PEXELS_API_KEY is unset");
  return raw;
}

function pickMp4(video) {
  const files = (video?.video_files ?? []).filter(
    (file) => file?.file_type === "video/mp4" && file.link,
  );
  files.sort((left, right) => (left.width ?? 0) - (right.width ?? 0));
  return files[0] ?? null;
}

export function attributionFor(video, query) {
  return {
    id: video?.id == null ? "" : String(video.id),
    query: String(query ?? ""),
    photographer: String(video?.user?.name ?? ""),
    photographerUrl: String(video?.user?.url ?? ""),
    pexelsUrl: String(video?.url ?? ""),
    file: video?.id == null ? "" : `${video.id}.mp4`,
  };
}

export async function searchPexelsVideos({
  query,
  apiKey,
  fetchImpl = fetch,
  perPage = 1,
} = {}) {
  const authorization = pexelsAuthorization(apiKey);
  const url = new URL(SEARCH_URL);
  url.searchParams.set("query", String(query ?? ""));
  url.searchParams.set("per_page", String(perPage));
  const response = await fetchImpl(url, {
    headers: { Authorization: authorization },
  });
  if (!response.ok) throw new Error(`Pexels search failed (${response.status})`);
  const body = await response.json();
  return body.videos ?? [];
}

export async function cachePexelsVideo({
  video,
  query,
  cacheDir,
  fetchImpl = fetch,
} = {}) {
  const record = attributionFor(video, query);
  if (!record.id || !record.file) throw new Error("Pexels video has no id");
  mkdirSync(cacheDir, { recursive: true });
  const videoPath = join(cacheDir, record.file);
  const sidecar = join(cacheDir, `${record.id}.json`);
  if (!existsSync(videoPath)) {
    const file = pickMp4(video);
    if (!file) throw new Error("Pexels video has no mp4");
    const response = await fetchImpl(file.link);
    if (!response.ok) throw new Error(`Pexels video download failed (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    writeFileSync(videoPath, bytes);
  }
  writeFileSync(sidecar, `${JSON.stringify(record, null, 2)}\n`);
  return { ...record, path: videoPath };
}

export function loadCachedBroll(cacheDir, id) {
  const sidecar = join(cacheDir, `${id}.json`);
  const record = JSON.parse(readFileSync(sidecar, "utf8"));
  return {
    file: join(cacheDir, record.file),
    photographer: record.photographer,
    photographerUrl: record.photographerUrl,
    pexelsUrl: record.pexelsUrl,
  };
}

export async function searchAndCachePexelsBroll({
  query,
  cacheDir,
  apiKey,
  fetchImpl = fetch,
} = {}) {
  const videos = await searchPexelsVideos({ query, apiKey, fetchImpl });
  const video = videos[0];
  if (!video) throw new Error("Pexels search returned no video");
  return cachePexelsVideo({ video, query, cacheDir, fetchImpl });
}
