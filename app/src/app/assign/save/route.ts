import { NextResponse } from "next/server";
import { saveAssignment } from "../load";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { membershipId?: string; spec?: unknown };
  try {
    body = (await request.json()) as { membershipId?: string; spec?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const result = await saveAssignment(request, body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
