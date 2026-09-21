import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  findHireBySession,
  publicHireRow,
  readHireActivation,
} from "@/lib/billing/hire-activation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const evidence = readHireActivation();
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  const session = await auth().catch(() => null);
  const email = session?.user?.email ?? "";
  const mine = sessionId ? findHireBySession(sessionId) : null;
  return NextResponse.json({
    ...evidence,
    rows: evidence.rows.map(publicHireRow),
    mine: mine ? publicHireRow(mine) : null,
    signed_in: Boolean(email),
  });
}
