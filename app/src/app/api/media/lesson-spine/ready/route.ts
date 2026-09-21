import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { LESSON_SPINE_MASTER_SHA256 } from "@/lib/player/lesson-spine-meta";
import { polishReadyFields } from "@/lib/player/publish-polish";

export const dynamic = "force-dynamic";

const CANDIDATES = [
  join(process.cwd(), "public/lessons/hls/ready.json"),
  join(process.cwd(), "public/lessons/ready.json"),
  "/opt/cursor/artifacts/lesson-spine-play-rail-hls/2026-09-21/ready.json",
];

export async function GET() {
  for (const dest of CANDIDATES) {
    if (!existsSync(dest)) continue;
    try {
      const body = JSON.parse(readFileSync(dest, "utf8"));
      if (body.master_sha256 !== LESSON_SPINE_MASTER_SHA256) continue;
      return NextResponse.json(
        polishReadyFields({
          ...body,
        }),
      );
    } catch {
      continue;
    }
  }
  return NextResponse.json(
    polishReadyFields({
      ok: false,
      status: "HELD",
      kind: "HLS",
      error: "ready_manifest_missing",
      master_sha256: LESSON_SPINE_MASTER_SHA256,
    }),
    { status: 404 },
  );
}
