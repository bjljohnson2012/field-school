import { NextResponse } from "next/server";
import { getPaidPlan } from "@/lib/billing/plans";
import { getSeat, successNotes } from "@/lib/billing/seats";
import { findPurchaseBySession } from "@/lib/members/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json({ status: "missing" }, { status: 400 });
  }

  const found = await findPurchaseBySession(sessionId);
  if (!found?.purchase || !found.member) {
    return NextResponse.json({ status: "pending" });
  }

  const plan = getPaidPlan(found.purchase.planId);
  const seat = getSeat(found.member.seatKind ?? found.purchase.seatKind);

  return NextResponse.json({
    status: "granted",
    email: found.member.email,
    seatKind: seat.kind,
    seatLabel: seat.label,
    planId: found.purchase.planId,
    planName: plan?.name ?? seat.label,
    hasPassword: Boolean(found.member.passwordHash),
    notes: successNotes(seat.kind),
  });
}
