import { NextResponse } from "next/server";
import { readLaunchGate } from "@/lib/player/launch-gate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readLaunchGate());
}
