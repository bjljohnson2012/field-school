import { NextResponse } from "next/server";
import { loadDesk } from "../load";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await loadDesk(request);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
