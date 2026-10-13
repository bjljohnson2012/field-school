import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { coachingTiers, consultingMailto, freeCourseHref, offerDisplayNames } from "../src/lib/billing/offer-names.ts";
import { PAID_PLANS } from "../src/lib/billing/plans.ts";
import {
  CHECKOUT_GO_LIVE,
  createStripeCheckoutSession,
  livePaymentLink,
  livePriceId,
  resolveCheckoutDestination,
  resolveOfferCheckout,
} from "../src/lib/billing/checkout-destination.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const livePrice = /price_1U8SW/;
const liveLink = /buy\.stripe\.com/;

test("offer keys are diy, coaching, assess, model, build, and consulting", () => {
  assert.deepEqual(Object.keys(offerDisplayNames), [
    "diy",
    "coaching",
    "assess",
    "model",
    "build",
    "consulting",
  ]);
  assert.deepEqual(
    coachingTiers.map((tier) => [tier.key, tier.name, tier.priceLabel]),
    [
      ["assess", "Assess", "$300"],
      ["model", "Model", "$600"],
      ["build", "Build", "$1,500"],
    ],
  );
  assert.equal(consultingMailto, "mailto:ben@fieldschool.ai?subject=Consulting");
  assert.equal(freeCourseHref, "/signup?plan=course");
});

test("the go-live flag stays off and live Payment Links stay unreachable", () => {
  const source = readFileSync(join(root, "src/lib/billing/checkout-destination.ts"), "utf8");
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.match(source, /export const CHECKOUT_GO_LIVE = false/);
  assert.equal(livePaymentLink(PAID_PLANS["100"]), null);
  assert.equal(livePaymentLink(PAID_PLANS["200"]), null);
  assert.equal(livePaymentLink(PAID_PLANS["1000"]), null);
  assert.equal(
    livePaymentLink(PAID_PLANS["100"], true),
    "https://buy.stripe.com/28EbJ0dlvaDVcrGcVg8g005",
  );
});

test("live price ids stay unreachable while the go-live flag is off", () => {
  assert.equal(livePriceId(PAID_PLANS["100"]), null);
  assert.equal(livePriceId(PAID_PLANS["10"]), null);
  assert.equal(livePriceId(PAID_PLANS["100"], true), "price_1U8SWYABZCvmsACoqlz5hgWP");
});

test("consulting stays Email Ben and diy starts the free course", async () => {
  const consulting = await resolveOfferCheckout({ offer: "consulting" });
  const diy = await resolveOfferCheckout({ offer: "diy" });
  assert.deepEqual(consulting, {
    url: "mailto:ben@fieldschool.ai?subject=Consulting",
    via: "email",
  });
  assert.deepEqual(diy, { url: "/signup?plan=course", via: "signup" });
});

test("checkout with a test key returns a test Checkout Session and posts no live price id", async () => {
  /** @type {RequestInit | undefined} */
  let init;
  let calls = 0;
  const fetchImpl = async (_url, options) => {
    calls += 1;
    init = options;
    return {
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/c/pay/cs_test_assess" }),
    };
  };
  const dest = await resolveOfferCheckout({
    offer: "assess",
    secretKey: "sk_test_dummy",
    origin: "https://portal.fieldschool.ai",
    email: "buyer@example.com",
    fetchImpl,
  });
  assert.equal(calls, 1);
  assert.deepEqual(dest, {
    url: "https://checkout.stripe.com/c/pay/cs_test_assess",
    via: "checkout_session",
  });
  const body = decodeURIComponent(String(init?.body ?? ""));
  assert.match(body, /\[unit_amount\]=30000/);
  assert.match(body, /\[offer\]=assess/);
  assert.match(body, /coaching_assess_monthly/);
  assert.doesNotMatch(body, livePrice);
  assert.doesNotMatch(body, liveLink);
  assert.doesNotMatch(body, /payment_method_types/);
  assert.match(String(init?.headers?.Authorization), /Bearer sk_test_dummy/);
});

test("a live Stripe key cannot open checkout while the go-live flag is off", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true, json: async () => ({ url: "https://buy.stripe.com/live" }) };
  };
  const dest = await resolveOfferCheckout({
    offer: "model",
    secretKey: "sk_live_dummy",
    origin: "https://portal.fieldschool.ai",
    fetchImpl,
  });
  assert.equal(calls, 0);
  assert.equal(dest.url, "https://portal.fieldschool.ai/pricing");
  assert.equal(isLiveUrl(dest.url), false);
});

test("checkout without a test key does not fall back to a live Payment Link", async () => {
  const dest = await resolveCheckoutDestination({
    plan: PAID_PLANS["100"],
    secretKey: "",
    origin: "https://portal.fieldschool.ai",
  });
  assert.equal(dest.url, "https://portal.fieldschool.ai/pricing");
  assert.equal(dest.via, "checkout_session");
  assert.doesNotMatch(dest.url, liveLink);
});

test("a failed test Checkout Session does not fall back to a live Payment Link", async () => {
  const dest = await resolveCheckoutDestination({
    plan: PAID_PLANS["200"],
    secretKey: "sk_test_dummy",
    origin: "https://portal.fieldschool.ai",
    createSession: async () => {
      throw new Error("stripe down");
    },
  });
  assert.equal(dest.url, "https://portal.fieldschool.ai/pricing");
  assert.doesNotMatch(dest.url, liveLink);
});

test("an explicit go-live flag can reach the stored Payment Link", async () => {
  const dest = await resolveCheckoutDestination({
    plan: PAID_PLANS["100"],
    secretKey: "",
    origin: "https://portal.fieldschool.ai",
    goLive: true,
  });
  assert.equal(dest.via, "payment_link");
  assert.equal(dest.url, "https://buy.stripe.com/28EbJ0dlvaDVcrGcVg8g005");
});

test("Checkout Session posts omit payment_method_types and tag the plan only after go-live", async () => {
  /** @type {RequestInit | undefined} */
  let init;
  const fetchImpl = async (_url, options) => {
    init = options;
    return {
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/c/pay/cs_test_ok" }),
    };
  };
  const url = await createStripeCheckoutSession({
    plan: PAID_PLANS["1000"],
    secretKey: "sk_test_dummy",
    origin: "https://portal.fieldschool.ai",
    email: "buyer@example.com",
    fetchImpl,
    goLive: true,
  });
  assert.equal(url, "https://checkout.stripe.com/c/pay/cs_test_ok");
  const body = decodeURIComponent(String(init?.body ?? ""));
  assert.match(body, /\[plan\]=1000/);
  assert.match(body, /client_reference_id=1000/);
  assert.match(body, /price_1U8SWZABZCvmsACo6SLipTTi/);
  assert.match(body, /mode=subscription/);
  assert.doesNotMatch(body, /payment_method_types/);
  const source = readFileSync(join(root, "src/lib/billing/checkout-destination.ts"), "utf8");
  assert.doesNotMatch(source, /payment_method_types/);
});

test("a checkout plan href does not contain a live Payment Link while go-live is false", async () => {
  const source = readFileSync(join(root, "src/lib/billing/checkout-destination.ts"), "utf8");
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.match(source, /export const CHECKOUT_GO_LIVE = false/);
  for (const plan of Object.values(PAID_PLANS)) {
    assert.equal(livePaymentLink(plan), null, plan.id);
    for (const secretKey of ["", "sk_live_dummy", "sk_test_dummy"]) {
      const dest = await resolveCheckoutDestination({
        plan,
        secretKey,
        origin: "https://portal.fieldschool.ai",
      });
      assert.equal(dest.url.includes("buy.stripe.com"), false, `${plan.id} ${secretKey || "empty"}`);
      assert.equal(isLiveUrl(dest.url), false, plan.id);
    }
  }
});

function isLiveUrl(url) {
  return url.startsWith("https://buy.stripe.com/");
}
