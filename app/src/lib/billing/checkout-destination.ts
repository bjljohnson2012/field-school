import { randomBytes } from "node:crypto";
import { coachingTiers, consultingMailto, freeCourseHref } from "./offer-names.ts";
import type { PaidPlan } from "./plans";

export const STRIPE_CHECKOUT_SESSIONS_URL =
  "https://api.stripe.com/v1/checkout/sessions";
export const STRIPE_API_VERSION = "2026-07-29.dahlia";

/** Live Payment Links and live price ids stay unreachable while this is false. */
export const CHECKOUT_GO_LIVE = false;

export type CheckoutVia = "checkout_session" | "payment_link";

export type CheckoutDestination = {
  url: string;
  via: CheckoutVia;
};

export type CoachingOfferKey = "assess" | "model" | "build";

export type OfferKey = "diy" | CoachingOfferKey | "consulting";

export type CheckoutSessionFactory = (input: {
  plan: PaidPlan;
  secretKey: string;
  origin: string;
  email?: string | null;
  goLive?: boolean;
}) => Promise<string | null>;

function testUnitCents(offer: CoachingOfferKey) {
  const tier = coachingTiers.find((item) => item.key === offer);
  const dollars = Number((tier?.priceLabel ?? "0").replace(/[^0-9]/g, ""));
  return String(dollars * 100);
}

function integrationIdentifier() {
  return `field-school-${randomBytes(4).toString("hex")}`;
}

export function isLiveStripeKey(secretKey: string) {
  return secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_");
}

export function isTestStripeKey(secretKey: string) {
  return secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_");
}

export function isLivePaymentLink(url: string) {
  return url.startsWith("https://buy.stripe.com/");
}

export function livePaymentLink(plan: PaidPlan, goLive = CHECKOUT_GO_LIVE) {
  if (!goLive) return null;
  return plan.checkoutUrl;
}

export function livePriceId(plan: PaidPlan, goLive = CHECKOUT_GO_LIVE) {
  if (!goLive) return null;
  return plan.stripePriceId;
}

function sessionFields(input: {
  plan?: PaidPlan;
  offer?: CoachingOfferKey;
  origin: string;
  email?: string | null;
  includeIntegrationId: boolean;
  goLive: boolean;
}) {
  const origin = input.origin.replace(/\/$/, "");
  const planId = input.offer ?? input.plan?.id ?? "";
  const learnWithBenCancel =
    input.goLive &&
    (planId === "100" || planId === "200" || planId === "1000");
  const fields: Record<string, string> = {
    mode: "subscription",
    "line_items[0][quantity]": "1",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: learnWithBenCancel
      ? `${origin}/play/lesson-spine`
      : `${origin}/pricing`,
    "metadata[plan]": planId,
    client_reference_id: planId,
  };
  if (input.goLive && input.plan) {
    fields["line_items[0][price]"] = input.plan.stripePriceId;
    if (input.plan.cadence !== "month") fields.mode = "payment";
  } else if (input.offer) {
    fields["line_items[0][price_data][currency]"] = "usd";
    fields["line_items[0][price_data][unit_amount]"] = testUnitCents(input.offer);
    fields["line_items[0][price_data][recurring][interval]"] = "month";
    fields["line_items[0][price_data][product_data][name]"] = "Coaching";
    fields["metadata[offer]"] = input.offer;
    fields["metadata[lookup_key]"] = `coaching_${input.offer}_monthly`;
  }
  if (input.email) fields.customer_email = input.email;
  if (input.includeIntegrationId) {
    fields.integration_identifier = integrationIdentifier();
  }
  return fields;
}

export async function createStripeCheckoutSession(input: {
  plan?: PaidPlan;
  offer?: CoachingOfferKey;
  secretKey: string;
  origin: string;
  email?: string | null;
  fetchImpl?: typeof fetch;
  goLive?: boolean;
}): Promise<string | null> {
  const goLive = input.goLive ?? CHECKOUT_GO_LIVE;
  const secretKey = input.secretKey.trim();
  if (!goLive && isLiveStripeKey(secretKey)) return null;
  if (!goLive && !isTestStripeKey(secretKey)) return null;
  if (!goLive && !input.offer) return null;
  if (goLive && !input.plan) return null;

  const fetchImpl = input.fetchImpl ?? fetch;
  const attempts = [true, false];
  for (const includeIntegrationId of attempts) {
    const response = await fetchImpl(STRIPE_CHECKOUT_SESSIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": STRIPE_API_VERSION,
      },
      body: new URLSearchParams(
        sessionFields({
          plan: input.plan,
          offer: input.offer,
          origin: input.origin,
          email: input.email,
          includeIntegrationId,
          goLive,
        }),
      ),
    });
    if (!response.ok) continue;
    const body = (await response.json()) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.startsWith("https://")) continue;
    if (!goLive && isLivePaymentLink(body.url)) continue;
    return body.url;
  }
  return null;
}

export async function resolveCheckoutDestination(input: {
  plan: PaidPlan;
  email?: string | null;
  origin?: string;
  secretKey?: string | null;
  createSession?: CheckoutSessionFactory;
  goLive?: boolean;
}): Promise<CheckoutDestination> {
  const goLive = input.goLive ?? CHECKOUT_GO_LIVE;
  const secret = (input.secretKey ?? process.env.STRIPE_SECRET_KEY ?? "").trim();
  const origin = (input.origin ?? defaultOrigin()).replace(/\/$/, "");
  const hold = { url: `${origin}/pricing`, via: "checkout_session" as const };
  if (secret && (goLive || isTestStripeKey(secret))) {
    try {
      const create = input.createSession ?? createStripeCheckoutSession;
      const url = await create({
        plan: input.plan,
        secretKey: secret,
        origin,
        email: input.email,
        goLive,
      });
      if (url && (goLive || !isLivePaymentLink(url))) return { url, via: "checkout_session" };
    } catch (error) {
      console.error("[checkout] Stripe Checkout Session failed", error);
    }
  }
  const link = livePaymentLink(input.plan, goLive);
  if (link) return { url: link, via: "payment_link" };
  return hold;
}

export async function resolveOfferCheckout(input: {
  offer: OfferKey;
  email?: string | null;
  origin?: string;
  secretKey?: string | null;
  fetchImpl?: typeof fetch;
  goLive?: boolean;
}): Promise<{ url: string; via: CheckoutVia | "signup" | "email" }> {
  if (input.offer === "diy") return { url: freeCourseHref, via: "signup" };
  if (input.offer === "consulting") return { url: consultingMailto, via: "email" };

  const goLive = input.goLive ?? CHECKOUT_GO_LIVE;
  const secret = (input.secretKey ?? "").trim();
  const origin = (input.origin ?? defaultOrigin()).replace(/\/$/, "");
  const tier = coachingTiers.find((item) => item.key === input.offer);
  if (!tier) return { url: `${origin}/pricing`, via: "checkout_session" };
  if (!goLive && isTestStripeKey(secret)) {
    const url = await createStripeCheckoutSession({
      offer: input.offer,
      secretKey: secret,
      origin,
      email: input.email,
      fetchImpl: input.fetchImpl,
      goLive,
    });
    if (url) return { url, via: "checkout_session" };
  }
  return { url: `${origin}/pricing`, via: "checkout_session" };
}

export function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

function defaultOrigin() {
  return (
    process.env.PORTAL_PUBLIC_URL?.trim().replace(/\/$/, "") ||
    "https://portal.fieldschool.ai"
  );
}
