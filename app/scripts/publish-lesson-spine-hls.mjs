#!/usr/bin/env node
/**
 * Publish Ready/HLS for the locked LessonSpine play rail.
 * Encodes HLS from the campus archive copy — never the source dest.
 * No Distribute. No Just remake. Master sha256 must stay af374d95….
 */
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath, pathToFileURL} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = join(here, "..");
export const ARCHIVE_DEST =
  "/opt/cursor/artifacts/campus-lesson-spine-master/2026-09-21/LessonSpine.mp4";
export const SOURCE_DEST =
  "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
export const LOCKED_SHA256 =
  "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
export const HLS_ARTIFACT_DIR =
  "/opt/cursor/artifacts/lesson-spine-play-rail-hls/2026-09-21";
export const HLS_PUBLIC_DIR = join(APP_ROOT, "public/lessons/hls");
export const LOCKED_JUST_ID = "27pn9xs0zk8a73g";
export const LOCKED_AUG30 = "vox/everything-made-up.mp4";

export function destAllowed(dest) {
  const value = String(dest || "");
  if (!value.trim()) return false;
  return !value.includes(LOCKED_JUST_ID) && !value.includes(LOCKED_AUG30);
}

export function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function buildReadyManifest(result) {
  return {
    ok: result.ok,
    status: result.ok ? "Ready" : "HELD",
    kind: "HLS",
    master_sha256: LOCKED_SHA256,
    source: ARCHIVE_DEST,
    source_dest: SOURCE_DEST,
    source_dest_untouched: true,
    hls_dir: HLS_ARTIFACT_DIR,
    hls_public: "/lessons/hls/LessonSpine.m3u8",
    mp4_fallback: "/api/media/lesson-spine",
    static_mp4: "/lessons/LessonSpine.mp4",
    distribute: false,
    launch: "CLOSED 0/8",
    play: "/play/lesson-spine",
    note: result.note,
  };
}

export function publishLessonSpineHls({
  source = ARCHIVE_DEST,
  artifactDir = HLS_ARTIFACT_DIR,
  publicDir = HLS_PUBLIC_DIR,
  dry = false,
} = {}) {
  const destOk = destAllowed(source);
  const exists = existsSync(source);
  const digest = exists ? sha256File(source) : "";
  const sourceDestDigest = existsSync(SOURCE_DEST) ? sha256File(SOURCE_DEST) : "";
  if (!destOk || !exists || digest !== LOCKED_SHA256) {
    return {
      ok: false,
      error: !destOk ? "dest_not_allowed" : !exists ? "archive_missing" : "dest_sha_mismatch",
      sha256: digest,
      source,
      distribute: false,
      exitCode: 2,
      note: "Publish Ready/HLS refused — archive must be destAllowed locked master af374d95",
    };
  }
  if (sourceDestDigest && sourceDestDigest !== LOCKED_SHA256) {
    return {
      ok: false,
      error: "source_dest_drift",
      sha256: digest,
      source,
      distribute: false,
      exitCode: 2,
      note: "Source dest drifted — refuse HLS so master stays untouched",
    };
  }
  if (dry) {
    return {
      ok: true,
      dry: true,
      sha256: digest,
      source,
      artifactDir,
      publicDir,
      distribute: false,
      exitCode: 0,
      note: "dry Ready/HLS — would ffmpeg from archive copy",
    };
  }
  mkdirSync(artifactDir, {recursive: true});
  mkdirSync(publicDir, {recursive: true});
  for (const dir of [artifactDir, publicDir]) {
    for (const name of readdirSync(dir)) {
      if (/\.(ts|m4s|m3u8|mp4|json)$/.test(name)) rmSync(join(dir, name));
    }
  }
  const playlist = join(artifactDir, "LessonSpine.m3u8");
  const ran = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      source,
      "-c:v",
      "copy",
      "-an",
      "-hls_time",
      "10",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_type",
      "fmp4",
      "-hls_fmp4_init_filename",
      "LessonSpine-init.mp4",
      "-hls_segment_filename",
      join(artifactDir, "LessonSpine-%03d.m4s"),
      playlist,
    ],
    {encoding: "utf8"},
  );
  if (ran.status !== 0 || !existsSync(playlist)) {
    return {
      ok: false,
      error: "ffmpeg_hls_failed",
      stderr: (ran.stderr || "").slice(-800),
      sha256: digest,
      source,
      distribute: false,
      exitCode: 1,
      note: "ffmpeg HLS failed; source dest untouched",
    };
  }
  const afterSource = existsSync(SOURCE_DEST) ? sha256File(SOURCE_DEST) : "";
  const afterArchive = sha256File(source);
  if (afterSource !== LOCKED_SHA256 || afterArchive !== LOCKED_SHA256) {
    return {
      ok: false,
      error: "master_mutated",
      sha256: afterArchive,
      source,
      distribute: false,
      exitCode: 1,
      note: "Refuse Ready if master or archive drifted during HLS",
    };
  }
  for (const name of readdirSync(artifactDir)) {
    copyFileSync(join(artifactDir, name), join(publicDir, name));
  }
  const result = {
    ok: true,
    status: "Ready",
    kind: "HLS",
    sha256: digest,
    source,
    artifactDir,
    publicDir,
    playlist: "/lessons/hls/LessonSpine.m3u8",
    distribute: false,
    launch: "CLOSED 0/8",
    source_dest_untouched: afterSource === LOCKED_SHA256,
    exitCode: 0,
    note: "Ready/HLS from campus archive copy. Source dest untouched. Distribute HELD.",
  };
  const manifest = buildReadyManifest(result);
  writeFileSync(join(artifactDir, "ready.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(publicDir, "ready.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(APP_ROOT, "public/lessons/ready.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return result;
}

function flag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return "";
  return args[i + 1] || "";
}

const invoked =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const args = process.argv.slice(2);
  if (args.includes("--distribute")) {
    console.log(JSON.stringify({ok: false, error: "distribute_held", note: "Distribute HELD"}));
    process.exit(2);
  }
  const result = publishLessonSpineHls({
    source: flag(args, "--source") || ARCHIVE_DEST,
    dry: args.includes("--dry"),
  });
  console.log(JSON.stringify(result));
  process.exit(result.exitCode);
}
