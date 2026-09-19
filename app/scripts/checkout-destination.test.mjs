import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PAID_PLANS } from "../src/lib/billing/plans.ts";
import {
  createStripeCheckoutSession,
  resolveCheckoutDestination,
} from "../src/lib/billing/checkout-destination.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("Learn with Ben and portal plan prices stay on the live Stripe seats", () => {
  assert.equal(PAID_PLANS["10"].priceLabel, "$10");
  assert.equal(PAID_PLANS["50"].priceLabel, "$50");
  assert.equal(PAID_PLANS["1059"].priceLabel, "$1,059");
  assert.equal(PAID_PLANS["100"].priceLabel, "$100");
  assert.equal(PAID_PLANS["200"].priceLabel, "$200");
  assert.equal(PAID_PLANS["1000"].priceLabel, "$1,000");
  assert.equal(PAID_PLANS["100"].checkoutUrl, "https://buy.stripe.com/28EbJ0dlvaDVcrGcVg8g005");
  assert.equal(PAID_PLANS["200"].checkoutUrl, "https://buy.stripe.com/8x25kCa9j6nF4Ze8F08g006");
  assert.equal(PAID_PLANS["1000"].checkoutUrl, "https://buy.stripe.com/aFa8wOgxHeUbcrG5sO8g007");
});

test("checkout falls back to the live Payment Link without a secret key", async () => {
  const dest = await resolveCheckoutDestination({
    plan: PAID_PLANS["100"],
    secretKey: "",
    origin: "https://portal.fieldschool.ai",
  });
  assert.equal(dest.via, "payment_link");
  assert.equal(dest.url, PAID_PLANS["100"].checkoutUrl);
});

test("checkout uses a Checkout Session when Stripe returns a URL", async () => {
  const dest = await resolveCheckoutDestination({
    plan: PAID_PLANS["10"],
    secretKey: "sk_test_dummy",
    origin: "https://portal.fieldschool.ai",
    email: "buyer@example.com",
    createSession: async () => "https://checkout.stripe.com/c/pay/cs_test_cart",
  });
  assert.equal(dest.via, "checkout_session");
  assert.equal(dest.url, "https://checkout.stripe.com/c/pay/cs_test_cart");
});

test("a failed Checkout Session falls back to the Payment Link", async () => {
  const dest = await resolveCheckoutDestination({
    plan: PAID_PLANS["200"],
    secretKey: "sk_test_dummy",
    origin: "https://portal.fieldschool.ai",
    createSession: async () => {
      throw new Error("stripe down");
    },
  });
  assert.equal(dest.via, "payment_link");
  assert.equal(dest.url, PAID_PLANS["200"].checkoutUrl);
});

test("Checkout Session posts omit payment_method_types and tag the plan", async () => {
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
  });
  assert.equal(url, "https://checkout.stripe.com/c/pay/cs_test_ok");
  const body = String(init?.body ?? "");
  assert.match(body, /metadata%5Bplan%5D=1000|metadata\[plan\]=1000/);
  assert.match(body, /client_reference_id=1000/);
  assert.match(body, /price_1U8SWZABZCvmsACo6SLipTTi/);
  assert.match(body, /mode=subscription/);
  assert.doesNotMatch(body, /payment_method_types/);
  const source = readFileSync(join(root, "src/lib/billing/checkout-destination.ts"), "utf8");
  assert.doesNotMatch(source, /payment_method_types/);
});
