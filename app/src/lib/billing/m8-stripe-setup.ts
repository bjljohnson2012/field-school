import {
  decideStripeKey,
  stripePriceSpec,
  type CoachingTierKey,
  type StripePriceSpec,
} from "./m8-prep.ts";

const TIERS: readonly CoachingTierKey[] = ["assess", "model", "build"];

export type StripeSetupResult =
  | {
      ok: true;
      applied: false;
      prices: StripePriceSpec[];
    }
  | {
      ok: false;
      reason: "live_key_refused" | "missing_or_unknown_key" | "live_refused";
      applied: false;
      prices: StripePriceSpec[];
    };

export function planStripeSetup(input: {
  key: string;
  allowLive: boolean;
  apply: boolean;
}): StripeSetupResult {
  const prices = TIERS.map((tier) => stripePriceSpec(tier));
  const decision = decideStripeKey({ key: input.key, allowLive: input.allowLive });
  if (!decision.ok) {
    return { ok: false, reason: decision.reason, applied: false, prices };
  }
  if (decision.mode === "live") {
    return { ok: false, reason: "live_refused", applied: false, prices };
  }
  if (input.apply) return { ok: true, applied: false, prices };
  return { ok: true, applied: false, prices };
}
