import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { destAllowed } from "@/lib/plates/rules";
import {
  LESSON_SPINE_ARCHIVE_DEST,
  LESSON_SPINE_MASTER_SHA256,
  LESSON_SPINE_PUBLIC_REL,
  LESSON_SPINE_SOURCE_DEST,
} from "@/lib/player/lesson-spine-meta";

export {
  LESSON_SPINE_ARCHIVE_DEST,
  LESSON_SPINE_CHAPTERS,
  LESSON_SPINE_DURATION_SEC,
  LESSON_SPINE_FRAMES,
  LESSON_SPINE_FPS,
  LESSON_SPINE_HLS_PUBLIC,
  LESSON_SPINE_MASTER_SHA256,
  LESSON_SPINE_PUBLIC_REL,
  LESSON_SPINE_READY_REL,
  LESSON_SPINE_SOURCE_DEST,
} from "@/lib/player/lesson-spine-meta";

export function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function resolveLessonSpineDest(cwd = process.cwd()) {
  const candidates = [
    process.env.LESSON_SPINE_MASTER,
    LESSON_SPINE_SOURCE_DEST,
    LESSON_SPINE_ARCHIVE_DEST,
    `${cwd}/${LESSON_SPINE_PUBLIC_REL}`,
    "/opt/field-school/public/lessons/LessonSpine.mp4",
  ].filter((value): value is string => Boolean(value && value.trim()));

  for (const dest of candidates) {
    if (!existsSync(dest)) continue;
    if (!destAllowed(dest)) continue;
    if (sha256File(dest) !== LESSON_SPINE_MASTER_SHA256) continue;
    return dest;
  }
  return null;
}
