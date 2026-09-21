import { randomBytes } from "node:crypto";
import type { PaidPlan } from "./plans";

export const STRIPE_CHECKOUT_SESSIONS_URL =
  "https://api.stripe.com/v1/checkout/sessions";
export const STRIPE_API_VERSION = "2026-07-29.dahlia";

export type CheckoutVia = "checkout_session" | "payment_link";

export type CheckoutDestination = {
  url: string;
  via: CheckoutVia;
};

export type CheckoutSessionFactory = (input: {
  plan: PaidPlan;
  secretKey: string;
  origin: string;
  email?: string | null;
}) => Promise<string | null>;

function integrationIdentifier() {
  return `field-school-${randomBytes(4).toString("hex")}`;
}

function sessionFields(input: {
  plan: PaidPlan;
  origin: string;
  email?: string | null;
  includeIntegrationId: boolean;
}) {
  const origin = input.origin.replace(/\/$/, "");
  const fields: Record<string, string> = {
    mode: input.plan.cadence === "month" ? "subscription" : "payment",
    "line_items[0][price]": input.plan.stripePriceId,
    "line_items[0][quantity]": "1",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      input.plan.id === "100" || input.plan.id === "200" || input.plan.id === "1000"
        ? `${origin}/play/lesson-spine`
        : `${origin}/cart?plan=${input.plan.id}`,
    "metadata[plan]": input.plan.id,
    client_reference_id: input.plan.id,
  };
  if (input.email) fields.customer_email = input.email;
  if (input.includeIntegrationId) {
    fields.integration_identifier = integrationIdentifier();
  }
  return fields;
}

export async function createStripeCheckoutSession(input: {
  plan: PaidPlan;
  secretKey: string;
  origin: string;
  email?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<string | null> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const attempts = [true, false];
  for (const includeIntegrationId of attempts) {
    const response = await fetchImpl(STRIPE_CHECKOUT_SESSIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": STRIPE_API_VERSION,
      },
      body: new URLSearchParams(
        sessionFields({
          plan: input.plan,
          origin: input.origin,
          email: input.email,
          includeIntegrationId,
        }),
      ),
    });
    if (!response.ok) continue;
    const body = (await response.json()) as { url?: unknown };
    if (typeof body.url === "string" && body.url.startsWith("https://")) {
      return body.url;
    }
  }
  return null;
}

export async function resolveCheckoutDestination(input: {
  plan: PaidPlan;
  email?: string | null;
  origin?: string;
  secretKey?: string | null;
  createSession?: CheckoutSessionFactory;
}): Promise<CheckoutDestination> {
  const secret = (input.secretKey ?? process.env.STRIPE_SECRET_KEY ?? "").trim();
  const origin = (input.origin ?? defaultOrigin()).replace(/\/$/, "");
  if (secret) {
    try {
      const create = input.createSession ?? createStripeCheckoutSession;
      const url = await create({
        plan: input.plan,
        secretKey: secret,
        origin,
        email: input.email,
      });
      if (url) return { url, via: "checkout_session" };
    } catch (error) {
      console.error("[checkout] Stripe Checkout Session failed; using payment link", error);
    }
  }
  return { url: input.plan.checkoutUrl, via: "payment_link" };
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
