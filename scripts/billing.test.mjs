import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
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
  assert.match(success, /CheckoutSuccessClient/);
  assert.match(success, /You're in/);
  assert.match(pricing, /checkoutPath\("10"\)/);
  assert.match(pricing, /Stripe/);
  assert.doesNotMatch(pricing, /invoice/i);
  assert.match(signup, /if \(paid\) redirect/);
  assert.match(coaching, /checkout\?plan=100/);
  assert.match(pricing, /Dayton, Ohio/);
  assert.match(marketing, /Dayton, Ohio/);
  assert.match(coaching, /Dayton, Ohio/);
  assert.match(pricing, /travel and stay/);
  assert.doesNotMatch(marketing, /Invoice later/);
  assert.doesNotMatch(coaching, /Invoice later/);
});

test("paid seats, webhook, and claim login are wired", () => {
  const seats = readSrc("src/lib/billing/seats.ts");
  const webhook = readSrc("src/app/api/stripe/webhook/route.ts");
  const status = readSrc("src/app/api/checkout/status/route.ts");
  const claim = readSrc("src/app/api/checkout/claim/route.ts");
  const store = readSrc("src/lib/members/store.ts");
  const fulfill = readSrc("src/lib/billing/fulfill.ts");
  const notify = readSrc("src/lib/members/notify.ts");
  const successClient = readSrc("src/app/checkout/success/success-client.tsx");
  const claimPage = readSrc("src/app/login/claim/page.tsx");
  const dashboard = readSrc("src/app/dashboard/page.tsx");
  const auth = readSrc("src/auth.ts");

  assert.match(seats, /coach_online/);
  assert.match(seats, /coach_room/);
  assert.match(seats, /unlimited portal/);
  assert.match(seats, /weekly online cohort/);
  assert.match(seats, /Dayton, Ohio/);
  assert.match(webhook, /checkout\.session\.completed/);
  assert.match(webhook, /STRIPE_WEBHOOK_SECRET/);
  assert.match(webhook, /verifyStripeSignature/);
  assert.match(webhook, /fulfillPaidCheckout/);
  assert.match(status, /findPurchaseBySession/);
  assert.match(claim, /setPasswordFromClaim/);
  assert.match(store, /applyPaidSeat/);
  assert.match(store, /stripeSessionId/);
  assert.match(fulfill, /emailSeatConfirmation/);
  assert.match(notify, /emailSeatConfirmation/);
  assert.match(successClient, /Set password and enter/);
  assert.match(claimPage, /Set your password/);
  assert.match(dashboard, /seatLabel/);
  assert.match(auth, /seatKind/);
});

function verifyStripeSignature(payload, header, secret, nowSec = Math.floor(Date.now() / 1000)) {
  const parts = new Map();
  for (const piece of header.split(",")) {
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
  if (Math.abs(nowSec - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  return signatures.some((signature) => {
    const got = Buffer.from(signature, "utf8");
    return got.length === expectedBuf.length && timingSafeEqual(got, expectedBuf);
  });
}

test("Stripe webhook signatures match the Stripe v1 scheme", () => {
  const payload = '{"type":"checkout.session.completed"}';
  const secret = "whsec_test";
  const t = "1700000000";
  const v1 = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${v1}`, secret, 1700000000), true);
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=deadbeef`, secret, 1700000000), false);
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${v1}`, secret, 1700000401), false);
});

test("coaching seats outrank portal seats and stay unlimited", () => {
  const rank = {
    free: 0,
    course: 1,
    portal_3: 2,
    portal_unlimited: 3,
    certification: 4,
    coach_online: 5,
    coach_room: 5,
    coach_one: 6,
  };
  assert.equal(rank.coach_online >= rank.portal_unlimited, true);
  assert.equal(rank.coach_room >= rank.portal_3, true);
  assert.equal(rank.course < rank.portal_3, true);
});
