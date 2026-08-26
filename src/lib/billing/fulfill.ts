import { getPaidPlan } from "@/lib/billing/plans";
import { confirmationCopy, portalOrigin } from "@/lib/billing/seats";
import type { CheckoutSessionFields } from "@/lib/billing/stripe-webhook";
import { emailSeatConfirmation } from "@/lib/members/notify";
import { applyPaidSeat } from "@/lib/members/store";

export async function fulfillPaidCheckout(session: CheckoutSessionFields) {
  if (!session.email) {
    return { ok: false as const, error: "Checkout session has no email." };
  }
  if (!session.planId) {
    return { ok: false as const, error: "Checkout session has no matching plan." };
  }

  const plan = getPaidPlan(session.planId);
  if (!plan) {
    return { ok: false as const, error: "Checkout session has no matching plan." };
  }

  const result = await applyPaidSeat({
    email: session.email,
    planId: session.planId,
    stripeSessionId: session.id,
    stripeCustomerId: session.customerId,
    stripeSubscriptionId: session.subscriptionId,
    amountTotal: session.amountTotal,
  });

  if (result.created) {
    const claimUrl = result.claimToken
      ? `${portalOrigin()}/login/claim?token=${result.claimToken}`
      : null;
    const copy = confirmationCopy({
      plan,
      email: session.email,
      claimUrl,
    });
    await emailSeatConfirmation({
      email: session.email,
      ...copy,
    });
  }

  return { ok: true as const, ...result };
}
