import { NextResponse } from "next/server";
import { lessonSpineLiveBroll } from "@/lib/player/live-pexels-broll-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const broll = await lessonSpineLiveBroll();
  return NextResponse.json({
    ok: true,
    broll,
    distribute: false,
  });
}
