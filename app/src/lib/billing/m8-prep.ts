import { isPaidPlanId, PAID_PLANS, type PaidPlanId } from "./plans.ts";

export const COACHING_TIER_KEYS = ["assess", "model", "build"] as const;

export type CoachingTierKey = (typeof COACHING_TIER_KEYS)[number];

export const COACHING_RECORD_KINDS = [
  "recap",
  "next_steps",
  "model_update",
  "quarterly_review",
] as const;

export type CoachingRecordKind = (typeof COACHING_RECORD_KINDS)[number];

export type CheckoutMode = "off" | "test";

export type OrgId = string & { readonly __brand: "OrgId" };

const SESSIONS_PER_MONTH = {
  assess: 1,
  model: 2,
  build: 4,
} as const satisfies Record<CoachingTierKey, 1 | 2 | 4>;

const MONTHLY_USD = {
  assess: 300,
  model: 600,
  build: 1500,
} as const satisfies Record<CoachingTierKey, 300 | 600 | 1500>;

const STRIPE_LOOKUP_KEYS = {
  assess: "coaching_assess_monthly",
  model: "coaching_model_monthly",
  build: "coaching_build_monthly",
} as const satisfies Record<CoachingTierKey, string>;

const TIER_NAMES = {
  assess: "Assess",
  model: "Model",
  build: "Build",
} as const satisfies Record<CoachingTierKey, string>;

const PUBLIC_PRICE_LABELS = ["$300", "$600", "$1,500"] as const;

export const RENDERED_OFFER_KEYS = [
  "diy",
  "assess",
  "model",
  "build",
  "consulting",
] as const;

export type OfferAction =
  | {
      kind: "email";
      label: "Email Ben";
      href:
        | "mailto:ben@fieldschool.ai?subject=Coaching"
        | "mailto:ben@fieldschool.ai?subject=Consulting";
    }
  | { kind: "checkout"; tier: CoachingTierKey; mode: "test" }
  | { kind: "signup"; href: "/signup?plan=course" };

export type StripeKeyDecision =
  | { ok: true; mode: "test" }
  | { ok: true; mode: "live" }
  | { ok: false; reason: "live_key_refused" }
  | { ok: false; reason: "missing_or_unknown_key" };

export type StripePriceSpec = {
  lookupKey: string;
  currency: "usd";
  interval: "month";
  unitAmountCents: number;
  productName: "Coaching";
};

export type WebhookEffect =
  | "upsert_seat"
  | "clear_seat"
  | "record_payment"
  | "record_failure"
  | "ignore";

export type CoachingRecord = {
  status: "draft" | "published";
  kind: CoachingRecordKind;
  orgId: OrgId;
};

export function parseCheckoutMode(raw: unknown): CheckoutMode {
  if (raw === "1" || raw === "true" || raw === "test") return "test";
  return "off";
}

export function parseOrgId(value: unknown): OrgId | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed as OrgId;
}

export function coachingAction(input: {
  tier: CoachingTierKey;
  mode: CheckoutMode;
}): OfferAction {
  switch (input.mode) {
    case "off":
      return {
        kind: "email",
        label: "Email Ben",
        href: "mailto:ben@fieldschool.ai?subject=Coaching",
      };
    case "test":
      return { kind: "checkout", tier: input.tier, mode: "test" };
    default: {
      const unreachable: never = input.mode;
      return unreachable;
    }
  }
}

export function consultingAction(): OfferAction {
  return {
    kind: "email",
    label: "Email Ben",
    href: "mailto:ben@fieldschool.ai?subject=Consulting",
  };
}

export function diyAction(): OfferAction {
  return { kind: "signup", href: "/signup?plan=course" };
}

export function individualIsPublic(): false {
  return false;
}

export function renderedOfferKeys(): readonly string[] {
  return RENDERED_OFFER_KEYS;
}

export function sessionsPerMonth(tier: CoachingTierKey): 1 | 2 | 4 {
  return SESSIONS_PER_MONTH[tier];
}

export function publicPriceLabel(tier: CoachingTierKey): string {
  const amount = MONTHLY_USD[tier];
  const digits = String(amount);
  if (digits.length <= 3) return `$${digits}`;
  return `$${digits.slice(0, -3)},${digits.slice(-3)}`;
}

export function publicCardText(tier: CoachingTierKey): string {
  return `${TIER_NAMES[tier]} ${publicPriceLabel(tier)} a month`;
}

export function priceOnPublicCard(label: string): "show" | "hide" {
  if (PUBLIC_PRICE_LABELS.some((item) => item === label)) return "show";
  return "hide";
}

export function stripePriceSpec(tier: CoachingTierKey): StripePriceSpec {
  return {
    lookupKey: STRIPE_LOOKUP_KEYS[tier],
    currency: "usd",
    interval: "month",
    unitAmountCents: MONTHLY_USD[tier] * 100,
    productName: "Coaching",
  };
}

export function decideStripeKey(input: {
  key: string;
  allowLive: boolean;
}): StripeKeyDecision {
  const key = input.key.trim();
  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) {
    return { ok: true, mode: "test" };
  }
  if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) {
    if (input.allowLive) return { ok: true, mode: "live" };
    return { ok: false, reason: "live_key_refused" };
  }
  return { ok: false, reason: "missing_or_unknown_key" };
}

export function webhookEffect(type: string): WebhookEffect {
  switch (type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "checkout.session.completed":
      return "upsert_seat";
    case "customer.subscription.deleted":
      return "clear_seat";
    case "invoice.paid":
      return "record_payment";
    case "invoice.payment_failed":
      return "record_failure";
    default:
      return "ignore";
  }
}

export function pricingRedirect(pathAndQuery: string): "/pricing" | null {
  const path = pathAndQuery.split("?")[0] ?? "";
  const normalized =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  if (normalized === "/cart" || normalized === "/checkout") return "/pricing";
  return null;
}

export function legacyStripePriceId(planId: PaidPlanId): string {
  return PAID_PLANS[planId].stripePriceId;
}

export function retiredPlanStillHasStripePrice(planId: string): boolean {
  if (!isPaidPlanId(planId)) return false;
  return PAID_PLANS[planId].stripePriceId.startsWith("price_");
}

export function sessionSlotsRemaining(input: {
  tier: CoachingTierKey;
  used: number;
}): number {
  const cap = SESSIONS_PER_MONTH[input.tier];
  if (!Number.isInteger(input.used) || input.used <= 0) return cap;
  if (input.used >= cap) return 0;
  return cap - input.used;
}

export function showsInBrain(record: CoachingRecord): boolean {
  return record.status === "published" && record.kind === "recap";
}

export function showsOnHome(record: CoachingRecord): boolean {
  return record.status === "published" && record.kind === "next_steps";
}
