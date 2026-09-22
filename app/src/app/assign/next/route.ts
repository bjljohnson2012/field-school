import { NextResponse } from "next/server";
import { saveNextPortion } from "../load";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { assignmentId?: string; unitId?: string };
  try {
    body = (await request.json()) as { assignmentId?: string; unitId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const result = await saveNextPortion(request, body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
