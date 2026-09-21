import {
  LEARN_WITH_BEN_PLAN_IDS,
  PAID_PLANS,
  checkoutPath,
} from "@/lib/billing/plans";

export const METERING_PRICE_SOURCE =
  "Locked Learn with Ben market-research unlock: $100 / $200 / $1,000. No new dollars.";

export const METERING_MODELS = [
  {
    id: "platform",
    title: "Platform credits + premium hire",
    body: "Campus tracks knowledge-brain use as platform credit units. Premium hire is the locked Learn with Ben monthly seat — not a new price.",
  },
  {
    id: "byok",
    title: "Bring your own key + monthly only",
    body: "BYOK skips per-use credit burns. The monthly hire is still the same unlocked Learn with Ben amounts. No extra dollar meter.",
  },
] as const;

export function learnWithBenHirePlans() {
  return LEARN_WITH_BEN_PLAN_IDS.map((id) => ({
    id,
    name: PAID_PLANS[id].name,
    priceLabel: PAID_PLANS[id].priceLabel,
    href: checkoutPath(id),
  }));
}
