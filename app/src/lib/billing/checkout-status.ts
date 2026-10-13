import { STRIPE_API_VERSION, STRIPE_CHECKOUT_SESSIONS_URL } from "./checkout-destination.ts";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type StripeKeyMode = "absent" | "test" | "live";

export type CheckoutParty = {
  email: string;
  orgIds: string[];
};

export type CheckoutDecision =
  | { action: "test_mode_only" }
  | { action: "pending" }
  | { action: "forbidden" }
  | { action: "answer" };

export function stripeKeyMode(secret: string): StripeKeyMode {
  const key = secret.trim();
  if (!key) return "absent";
  if (key.startsWith("sk_test_")) return "test";
  return "live";
}

export function checkoutStatusAllowed(caller: CheckoutParty, purchase: CheckoutParty) {
  const callerEmail = normalizeEmail(caller.email);
  const purchaseEmail = normalizeEmail(purchase.email);
  if (callerEmail && callerEmail === purchaseEmail) return true;
  return caller.orgIds.some((orgId) => purchase.orgIds.includes(orgId));
}

export function decideCheckoutStatus(input: {
  secret: string;
  hasPurchase: boolean;
  localAllowed: boolean;
  stripeMatches: boolean | null;
}): CheckoutDecision {
  if (stripeKeyMode(input.secret) === "live") return { action: "test_mode_only" };
  if (!input.hasPurchase) return { action: "pending" };
  if (!input.localAllowed) return { action: "forbidden" };
  if (stripeKeyMode(input.secret) === "test" && input.stripeMatches !== true) {
    return { action: "forbidden" };
  }
  return { action: "answer" };
}

type StripeSessionBody = {
  id?: unknown;
  livemode?: unknown;
  customer_email?: unknown;
  customer_details?: { email?: unknown };
  metadata?: { org_id?: unknown; org?: unknown };
};

export async function stripeSessionMatchesCaller(input: {
  sessionId: string;
  secret: string;
  caller: CheckoutParty;
  purchaseEmail: string;
  fetchImpl?: typeof fetch;
}) {
  if (stripeKeyMode(input.secret) !== "test") return false;
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `${STRIPE_CHECKOUT_SESSIONS_URL}/${encodeURIComponent(input.sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${input.secret}`,
        "Stripe-Version": STRIPE_API_VERSION,
      },
    },
  );
  if (!response.ok) return false;
  const body = (await response.json()) as StripeSessionBody;
  if (body.id !== input.sessionId || body.livemode === true) return false;
  const email = typeof body.customer_email === "string" ? body.customer_email : "";
  const detail =
    body.customer_details && typeof body.customer_details.email === "string"
      ? body.customer_details.email
      : "";
  const stripeEmail = normalizeEmail(email || detail);
  const callerEmail = normalizeEmail(input.caller.email);
  const purchaseEmail = normalizeEmail(input.purchaseEmail);
  if (stripeEmail) return stripeEmail === callerEmail || stripeEmail === purchaseEmail;
  const meta = body.metadata ?? {};
  const org = typeof meta.org_id === "string" ? meta.org_id : typeof meta.org === "string" ? meta.org : "";
  if (org) return input.caller.orgIds.includes(org);
  return true;
}
