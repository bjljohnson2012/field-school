import { createHmac, timingSafeEqual } from "node:crypto";
import {
  isPaidPlanId,
  type PaidPlanId,
} from "@/lib/billing/plans";
import {
  planIdFromAmountTotal,
  planIdFromStripePrice,
} from "@/lib/billing/seats";

export type CheckoutSessionFields = {
  id: string;
  email: string | null;
  planId: PaidPlanId | null;
  customerId: string | null;
  subscriptionId: string | null;
  amountTotal: number | null;
};

export type StripeEventKind =
  | "checkout.session.completed"
  | "customer.subscription.deleted"
  | "customer.subscription.updated"
  | "other";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function stripeId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  const record = asRecord(value);
  if (record && typeof record.id === "string" && record.id.trim()) {
    return record.id.trim();
  }
  return null;
}

function firstPriceId(session: Record<string, unknown>): string | null {
  const lineItems = asRecord(session.line_items);
  const data = lineItems?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = asRecord(data[0]);
  const price = asRecord(first?.price);
  return typeof price?.id === "string" ? price.id : null;
}

export function verifyStripeSignature(input: {
  payload: string;
  header: string | null;
  secret: string;
  nowSec?: number;
  toleranceSec?: number;
}): boolean {
  if (!input.header || !input.secret) return false;
  const parts = new Map<string, string[]>();
  for (const piece of input.header.split(",")) {
    const eq = piece.indexOf("=");
    if (eq < 0) continue;
    const key = piece.slice(0, eq).trim();
    const value = piece.slice(eq + 1).trim();
    const list = parts.get(key) ?? [];
    list.push(value);
    parts.set(key, list);
  }
  const timestamp = parts.get("t")?.[0];
  const signatures = parts.get("v1") ?? [];
  if (!timestamp || signatures.length === 0) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = input.nowSec ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSec ?? 300;
  if (Math.abs(now - ts) > tolerance) return false;

  const expected = createHmac("sha256", input.secret)
    .update(`${timestamp}.${input.payload}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  return signatures.some((signature) => {
    const got = Buffer.from(signature, "utf8");
    return got.length === expectedBuf.length && timingSafeEqual(got, expectedBuf);
  });
}

export function parseStripeEventType(payload: unknown): StripeEventKind {
  const record = asRecord(payload);
  const type = typeof record?.type === "string" ? record.type : "";
  if (type === "checkout.session.completed") return type;
  if (type === "customer.subscription.deleted") return type;
  if (type === "customer.subscription.updated") return type;
  return "other";
}

export function parseCheckoutSession(payload: unknown): CheckoutSessionFields | null {
  const event = asRecord(payload);
  const data = asRecord(event?.data);
  const session = asRecord(data?.object) ?? event;
  if (!session) return null;
  const id = typeof session.id === "string" ? session.id.trim() : "";
  if (!id.startsWith("cs_")) return null;

  const details = asRecord(session.customer_details);
  const metadata = asRecord(session.metadata);
  const emailRaw =
    (typeof details?.email === "string" && details.email) ||
    (typeof session.customer_email === "string" && session.customer_email) ||
    "";
  const email = emailRaw.trim().toLowerCase() || null;

  const metaPlan =
    typeof metadata?.plan === "string"
      ? metadata.plan
      : typeof session.client_reference_id === "string"
        ? session.client_reference_id
        : "";
  const amountTotal =
    typeof session.amount_total === "number" ? session.amount_total : null;
  const planId = isPaidPlanId(metaPlan)
    ? metaPlan
    : planIdFromStripePrice(firstPriceId(session)) ??
      planIdFromAmountTotal(amountTotal);

  return {
    id,
    email,
    planId,
    customerId: stripeId(session.customer),
    subscriptionId: stripeId(session.subscription),
    amountTotal,
  };
}

export function parseSubscriptionId(payload: unknown): string | null {
  const event = asRecord(payload);
  const data = asRecord(event?.data);
  const subscription = asRecord(data?.object);
  return stripeId(subscription?.id ?? subscription);
}

export function subscriptionShouldDowngrade(payload: unknown): boolean {
  const event = asRecord(payload);
  const type = typeof event?.type === "string" ? event.type : "";
  if (type === "customer.subscription.deleted") return true;
  const data = asRecord(event?.data);
  const subscription = asRecord(data?.object);
  const status = typeof subscription?.status === "string" ? subscription.status : "";
  return status === "canceled" || status === "unpaid" || status === "incomplete_expired";
}
