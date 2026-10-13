import { NextResponse } from "next/server";
import {
  checkoutStatusAllowed,
  decideCheckoutStatus,
  stripeSessionMatchesCaller,
} from "@/lib/billing/checkout-status";
import { stripeSecretKey } from "@/lib/billing/checkout-destination";
import { findHireBySession, isHirePlanId } from "@/lib/billing/hire-activation";
import { getPaidPlan } from "@/lib/billing/plans";
import { getSeat, successNotes } from "@/lib/billing/seats";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { orgIdsForEmail } from "@/lib/members/staff-orgs";
import { findPurchaseBySession } from "@/lib/members/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ status: "forbidden", error: auth.error }, { status: auth.status });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json({ status: "missing" }, { status: 400 });
  }

  const secret = stripeSecretKey();
  const found = await findPurchaseBySession(sessionId);
  const purchase = found?.purchase && found.member ? found : null;
  const callerOrgIds = auth.memberships.map((row) => row.orgId);
  const purchaseOrgIds = purchase ? await orgIdsForEmail(purchase.purchase.email) : [];
  const localAllowed = purchase
    ? checkoutStatusAllowed(
        { email: auth.identity.email, orgIds: callerOrgIds },
        { email: purchase.purchase.email, orgIds: purchaseOrgIds },
      )
    : false;
  const stripeMatches =
    purchase && secret.startsWith("sk_test_") && localAllowed
      ? await stripeSessionMatchesCaller({
          sessionId,
          secret,
          caller: { email: auth.identity.email, orgIds: callerOrgIds },
          purchaseEmail: purchase.purchase.email,
        })
      : null;
  const decision = decideCheckoutStatus({
    secret,
    hasPurchase: Boolean(purchase),
    localAllowed,
    stripeMatches,
  });
  if (decision.action === "test_mode_only") {
    return NextResponse.json({ status: "forbidden", error: "stripe_test_mode_only" }, { status: 403 });
  }
  if (decision.action === "pending") {
    return NextResponse.json({ status: "pending" });
  }
  if (decision.action === "forbidden" || !found?.purchase || !found.member) {
    return NextResponse.json({ status: "forbidden", error: "not_your_session" }, { status: 403 });
  }

  const plan = getPaidPlan(found.purchase.planId);
  const seat = getSeat(found.member.seatKind ?? found.purchase.seatKind);
  const hire = isHirePlanId(found.purchase.planId) ? findHireBySession(sessionId) : null;

  return NextResponse.json({
    status: "granted",
    email: found.member.email,
    seatKind: seat.kind,
    seatLabel: seat.label,
    planId: found.purchase.planId,
    planName: plan?.name ?? seat.label,
    hasPassword: Boolean(found.member.passwordHash),
    notes: successNotes(seat.kind),
    hireActivated: Boolean(hire),
    next: hire ? "/metering" : "/dashboard",
  });
}
