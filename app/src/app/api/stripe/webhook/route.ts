import { NextResponse } from "next/server";
import { fulfillPaidCheckout } from "@/lib/billing/fulfill";
import {
  parseCheckoutSession,
  parseStripeEventType,
  parseSubscriptionId,
  subscriptionShouldDowngrade,
  verifyStripeSignature,
} from "@/lib/billing/stripe-webhook";
import { downgradeExpiredSubscription } from "@/lib/members/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const header = request.headers.get("stripe-signature");
  if (!verifyStripeSignature({ payload, header, secret })) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(payload) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const kind = parseStripeEventType(body);
  if (kind === "checkout.session.completed") {
    const session = parseCheckoutSession(body);
    if (!session) {
      console.info("[stripe-webhook] checkout session could not be parsed");
      return NextResponse.json({ received: true, skipped: true });
    }
    const result = await fulfillPaidCheckout(session);
    if (!result.ok) {
      console.info("[stripe-webhook] checkout not fulfilled", result.error);
      return NextResponse.json({ received: true, skipped: true });
    }
    return NextResponse.json({ received: true, granted: result.created });
  }

  if (
    (kind === "customer.subscription.deleted" ||
      kind === "customer.subscription.updated") &&
    subscriptionShouldDowngrade(body)
  ) {
    const subscriptionId = parseSubscriptionId(body);
    if (subscriptionId) {
      await downgradeExpiredSubscription(subscriptionId);
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
