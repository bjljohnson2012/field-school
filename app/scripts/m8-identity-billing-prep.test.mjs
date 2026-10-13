import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  coachingAction,
  consultingAction,
  decideStripeKey,
  diyAction,
  individualIsPublic,
  legacyStripePriceId,
  parseCheckoutMode,
  parseOrgId,
  priceOnPublicCard,
  pricingRedirect,
  publicCardText,
  renderedOfferKeys,
  retiredPlanStillHasStripePrice,
  sessionSlotsRemaining,
  showsInBrain,
  showsOnHome,
  stripePriceSpec,
  webhookEffect,
} from "../src/lib/billing/m8-prep.ts";

test("Model with checkout off emails Ben", () => {
  assert.deepEqual(coachingAction({ tier: "model", mode: "off" }), {
    kind: "email",
    label: "Email Ben",
    href: "mailto:ben@fieldschool.ai?subject=Coaching",
  });
});

test("Model with checkout test opens test checkout", () => {
  assert.equal(parseCheckoutMode("true"), "test");
  assert.equal(parseCheckoutMode("1"), "test");
  assert.equal(parseCheckoutMode("test"), "test");
  assert.equal(parseCheckoutMode("live"), "off");
  assert.equal(parseCheckoutMode(undefined), "off");
  assert.equal(parseCheckoutMode(""), "off");
  assert.deepEqual(
    coachingAction({ tier: "model", mode: parseCheckoutMode("true") }),
    { kind: "checkout", tier: "model", mode: "test" },
  );
});

test("Consulting always emails Ben and DIY starts the free course", () => {
  assert.deepEqual(consultingAction(), {
    kind: "email",
    label: "Email Ben",
    href: "mailto:ben@fieldschool.ai?subject=Consulting",
  });
  assert.deepEqual(diyAction(), { kind: "signup", href: "/signup?plan=course" });
});

test("Individual is unpublished and Learn with Ben is not a card", () => {
  assert.equal(individualIsPublic(), false);
  assert.deepEqual(renderedOfferKeys(), [
    "diy",
    "assess",
    "model",
    "build",
    "consulting",
  ]);
  assert.equal(publicCardText("assess"), "Assess $300 a month");
  assert.equal(publicCardText("model"), "Model $600 a month");
  assert.equal(publicCardText("build"), "Build $1,500 a month");
});

test("retired prices stay off the public card and old Stripe ids still resolve", () => {
  assert.equal(priceOnPublicCard("$300"), "show");
  assert.equal(priceOnPublicCard("$600"), "show");
  assert.equal(priceOnPublicCard("$1,500"), "show");
  assert.equal(priceOnPublicCard("$10"), "hide");
  assert.equal(priceOnPublicCard("$50"), "hide");
  assert.equal(priceOnPublicCard("$1,059"), "hide");
  assert.equal(priceOnPublicCard("$100"), "hide");
  assert.equal(priceOnPublicCard("$200"), "hide");
  assert.equal(priceOnPublicCard("$1,000"), "hide");
  assert.equal(retiredPlanStillHasStripePrice("100"), true);
  assert.equal(retiredPlanStillHasStripePrice("assess"), false);
  assert.equal(
    legacyStripePriceId("100"),
    "price_1U8SWYABZCvmsACoqlz5hgWP",
  );
});

test("a live Stripe key is refused unless allowLive is set", () => {
  assert.deepEqual(decideStripeKey({ key: "sk_test_prep", allowLive: false }), {
    ok: true,
    mode: "test",
  });
  assert.deepEqual(decideStripeKey({ key: "sk_live_prep", allowLive: false }), {
    ok: false,
    reason: "live_key_refused",
  });
  assert.deepEqual(decideStripeKey({ key: "rk_live_prep", allowLive: false }), {
    ok: false,
    reason: "live_key_refused",
  });
  assert.deepEqual(decideStripeKey({ key: "sk_live_prep", allowLive: true }), {
    ok: true,
    mode: "live",
  });
  assert.deepEqual(decideStripeKey({ key: "", allowLive: true }), {
    ok: false,
    reason: "missing_or_unknown_key",
  });
});

test("Coaching prices are three monthly lookup keys", () => {
  assert.deepEqual(stripePriceSpec("assess"), {
    lookupKey: "coaching_assess_monthly",
    currency: "usd",
    interval: "month",
    unitAmountCents: 30000,
    productName: "Coaching",
  });
  assert.deepEqual(stripePriceSpec("model"), {
    lookupKey: "coaching_model_monthly",
    currency: "usd",
    interval: "month",
    unitAmountCents: 60000,
    productName: "Coaching",
  });
  assert.deepEqual(stripePriceSpec("build"), {
    lookupKey: "coaching_build_monthly",
    currency: "usd",
    interval: "month",
    unitAmountCents: 150000,
    productName: "Coaching",
  });
});

test("webhook types map to seat and invoice effects", () => {
  assert.equal(webhookEffect("customer.subscription.created"), "upsert_seat");
  assert.equal(webhookEffect("customer.subscription.updated"), "upsert_seat");
  assert.equal(webhookEffect("checkout.session.completed"), "upsert_seat");
  assert.equal(webhookEffect("customer.subscription.deleted"), "clear_seat");
  assert.equal(webhookEffect("invoice.paid"), "record_payment");
  assert.equal(webhookEffect("invoice.payment_failed"), "record_failure");
  assert.equal(webhookEffect("customer.created"), "ignore");
});

test("cart and checkout redirect to pricing", () => {
  assert.equal(pricingRedirect("/cart"), "/pricing");
  assert.equal(pricingRedirect("/cart?plan=10"), "/pricing");
  assert.equal(pricingRedirect("/checkout"), "/pricing");
  assert.equal(pricingRedirect("/checkout?plan=100"), "/pricing");
  assert.equal(pricingRedirect("/checkout/"), "/pricing");
  assert.equal(pricingRedirect("/pricing"), null);
  assert.equal(pricingRedirect("/checkout/success"), null);
});

test("a Model org has two session slots", () => {
  assert.equal(sessionSlotsRemaining({ tier: "model", used: 0 }), 2);
  assert.equal(sessionSlotsRemaining({ tier: "model", used: 2 }), 0);
  assert.equal(sessionSlotsRemaining({ tier: "assess", used: 0 }), 1);
  assert.equal(sessionSlotsRemaining({ tier: "build", used: 0 }), 4);
});

test("a published recap shows in the brain and next steps show on Home", () => {
  const orgId = parseOrgId("org_model");
  assert.equal(orgId, "org_model");
  assert.equal(parseOrgId(""), null);
  assert.equal(parseOrgId("   "), null);
  assert.equal(parseOrgId(12), null);
  assert.equal(
    showsInBrain({ status: "published", kind: "recap", orgId }),
    true,
  );
  assert.equal(showsInBrain({ status: "draft", kind: "recap", orgId }), false);
  assert.equal(
    showsOnHome({ status: "published", kind: "next_steps", orgId }),
    true,
  );
  assert.equal(
    showsOnHome({ status: "published", kind: "recap", orgId }),
    false,
  );
  assert.equal(
    showsOnHome({ status: "draft", kind: "next_steps", orgId }),
    false,
  );
});

test("prep module does not import tenancy, offer-names, or app/db", () => {
  const source = readFileSync(
    new URL("../src/lib/billing/m8-prep.ts", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("offer-names"), false);
  assert.equal(source.includes("lib/tenancy"), false);
  assert.equal(source.includes("app/db"), false);
});
