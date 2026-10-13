import { planStripeSetup } from "../src/lib/billing/m8-stripe-setup.ts";

const result = planStripeSetup({
  key: process.env.STRIPE_SECRET_KEY ?? "",
  allowLive: process.argv.includes("--live"),
  apply: process.argv.includes("--apply"),
});

if (!result.ok) {
  console.error(result.reason);
  process.exit(result.reason === "missing_or_unknown_key" ? 1 : 2);
}

console.log(JSON.stringify({ applied: result.applied, prices: result.prices }));
