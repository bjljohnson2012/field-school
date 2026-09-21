import { readFileSync } from "node:fs";
import { NextResponse } from "next/server";
import {
  LESSON_SPINE_MASTER_SHA256,
  resolveLessonSpineDest,
} from "@/lib/player/lesson-spine";

export const dynamic = "force-dynamic";

export async function GET() {
  const dest = resolveLessonSpineDest();
  if (!dest) {
    return NextResponse.json(
      { ok: false, error: "lesson_spine_master_missing" },
      { status: 404 },
    );
  }
  const bytes = readFileSync(dest);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": 'inline; filename="LessonSpine.mp4"',
      "Cache-Control": "public, max-age=3600",
      "X-Lesson-Spine-Sha256": LESSON_SPINE_MASTER_SHA256,
      "Accept-Ranges": "bytes",
      "Content-Length": String(bytes.byteLength),
    },
  });
}
