export const LESSON_SPINE_MASTER_SHA256 =
  "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";

export const LESSON_SPINE_SOURCE_DEST =
  "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";

export const LESSON_SPINE_ARCHIVE_DEST =
  "/opt/cursor/artifacts/campus-lesson-spine-master/2026-09-21/LessonSpine.mp4";

export const LESSON_SPINE_PUBLIC_REL = "public/lessons/LessonSpine.mp4";

export const LESSON_SPINE_DURATION_SEC = 41;
export const LESSON_SPINE_FRAMES = 1230;
export const LESSON_SPINE_FPS = 30;

export const LESSON_SPINE_CHAPTERS = [
  { id: "sting", label: "Sting", startSec: 0, endSec: 10 },
  { id: "slate", label: "Slate", startSec: 10, endSec: 18 },
  { id: "objective", label: "Objective", startSec: 18, endSec: 24 },
  { id: "recap", label: "Recap", startSec: 24, endSec: 34 },
  { id: "next-up", label: "Next up", startSec: 34, endSec: 41 },
] as const;
