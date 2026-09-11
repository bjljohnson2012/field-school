export const PAID_PLAN_IDS = [
  "10",
  "50",
  "1059",
  "100",
  "200",
  "1000",
] as const;

export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export type PaidPlan = {
  id: PaidPlanId;
  name: string;
  priceLabel: string;
  cadence: "month" | "once";
  stripePriceId: string;
  stripePaymentLinkId: string;
  checkoutUrl: string;
};

export const PAID_PLANS: Record<PaidPlanId, PaidPlan> = {
  "10": {
    id: "10",
    name: "Up to three courses",
    priceLabel: "$10",
    cadence: "month",
    stripePriceId: "price_1U8SWWABZCvmsACo5Dg1IOF1",
    stripePaymentLinkId: "plink_1U8SX8ABZCvmsACoXar5fZPR",
    checkoutUrl: "https://buy.stripe.com/5kQ9ASepzaDV63i3kG8g003",
  },
  "50": {
    id: "50",
    name: "More than three courses",
    priceLabel: "$50",
    cadence: "month",
    stripePriceId: "price_1U8SWXABZCvmsACoE5CBz6lg",
    stripePaymentLinkId: "plink_1U8SX9ABZCvmsACofPqY7FEw",
    checkoutUrl: "https://buy.stripe.com/6oU6oGbdn4fxgHWdZk8g004",
  },
  "1059": {
    id: "1059",
    name: "Certification",
    priceLabel: "$1,059",
    cadence: "once",
    stripePriceId: "price_1U8SWYABZCvmsACotpOTvlJ5",
    stripePaymentLinkId: "plink_1U8SWlABZCvmsACoIP0xBVtc",
    checkoutUrl: "https://buy.stripe.com/6oUdR86X75jBfDSbRc8g002",
  },
  "100": {
    id: "100",
    name: "Online cohort",
    priceLabel: "$100",
    cadence: "month",
    stripePriceId: "price_1U8SWYABZCvmsACoqlz5hgWP",
    stripePaymentLinkId: "plink_1U8SXAABZCvmsACojigARCg1",
    checkoutUrl: "https://buy.stripe.com/28EbJ0dlvaDVcrGcVg8g005",
  },
  "200": {
    id: "200",
    name: "In the room",
    priceLabel: "$200",
    cadence: "month",
    stripePriceId: "price_1U8SWYABZCvmsACo83J0YNYs",
    stripePaymentLinkId: "plink_1U8SXAABZCvmsACoqNNQLVKq",
    checkoutUrl: "https://buy.stripe.com/8x25kCa9j6nF4Ze8F08g006",
  },
  "1000": {
    id: "1000",
    name: "One-on-one hour",
    priceLabel: "$1,000",
    cadence: "month",
    stripePriceId: "price_1U8SWZABZCvmsACo6SLipTTi",
    stripePaymentLinkId: "plink_1U8SXBABZCvmsACopEIcTIuE",
    checkoutUrl: "https://buy.stripe.com/aFa8wOgxHeUbcrG5sO8g007",
  },
};

export function isPaidPlanId(value: string | null | undefined): value is PaidPlanId {
  return Boolean(value && (PAID_PLAN_IDS as readonly string[]).includes(value));
}

export function getPaidPlan(value: string | null | undefined): PaidPlan | null {
  if (!isPaidPlanId(value)) return null;
  return PAID_PLANS[value];
}

export function checkoutPath(id: PaidPlanId) {
  return `/checkout?plan=${id}`;
}
