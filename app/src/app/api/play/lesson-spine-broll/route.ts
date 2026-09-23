import { NextResponse } from "next/server";
import { lessonSpineBrollPayload } from "@/lib/player/live-pexels-broll-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = await lessonSpineBrollPayload();
  return NextResponse.json({ ...body, distribute: false });
}
