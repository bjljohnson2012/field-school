import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const PAID_PLAN_IDS = ["10", "50", "1059", "100", "200", "1000"];

function isPaidPlanId(value) {
  return PAID_PLAN_IDS.includes(value);
}

test("paid plan ids match the live Stripe seats", () => {
  assert.equal(isPaidPlanId("10"), true);
  assert.equal(isPaidPlanId("1000"), true);
  assert.equal(isPaidPlanId("course"), false);
  assert.equal(isPaidPlanId(""), false);
});

test("checkout, pricing, and marketing paid seats point at Stripe", () => {
  const plans = readSrc("src/lib/billing/plans.ts");
  const checkout = readSrc("src/app/checkout/page.tsx");
  const success = readSrc("src/app/checkout/success/page.tsx");
  const pricing = readSrc("src/app/pricing/page.tsx");
  const signup = readSrc("src/app/signup/page.tsx");
  const marketing = readSrc("marketing-site/pricing.html");
  const coaching = readSrc("marketing-site/coaching.html");

  for (const id of PAID_PLAN_IDS) {
    assert.match(plans, new RegExp(`"${id}"`));
    assert.match(plans, /buy\.stripe\.com/);
    assert.match(plans, new RegExp(`price_1U8SW`));
    assert.match(marketing, new RegExp(`/checkout\\?plan=${id}`));
  }
  assert.match(checkout, /getPaidPlan/);
  assert.match(checkout, /redirect\(plan\.checkoutUrl\)/);
  assert.match(success, /Create a login/);
  assert.match(pricing, /checkoutPath\("10"\)/);
  assert.match(pricing, /Stripe/);
  assert.doesNotMatch(pricing, /invoice/i);
  assert.match(signup, /if \(paid\) redirect/);
  assert.match(coaching, /checkout\?plan=100/);
  assert.doesNotMatch(marketing, /Invoice later/);
  assert.doesNotMatch(coaching, /Invoice later/);
});
