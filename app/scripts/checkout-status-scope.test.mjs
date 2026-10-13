import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  checkoutStatusAllowed,
  decideCheckoutStatus,
  stripeKeyMode,
  stripeSessionMatchesCaller,
} from "../src/lib/billing/checkout-status.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const status = readFileSync(join(root, "src/app/api/checkout/status/route.ts"), "utf8");

test("checkout status checks the caller before it answers", () => {
  assert.match(status, /identityFromRequest/);
  assert.match(status, /decideCheckoutStatus/);
  assert.match(status, /stripe_test_mode_only/);
  assert.match(status, /findPurchaseBySession/);
  assert.match(status, /hireActivated/);
  assert.doesNotMatch(status, /sk_live_/);
});

test("checkout status answers only for the caller member or org, and never with a live key", async () => {
  assert.equal(stripeKeyMode("sk_live_secret"), "live");
  assert.equal(stripeKeyMode("sk_test_secret"), "test");
  assert.equal(stripeKeyMode(""), "absent");
  assert.equal(
    checkoutStatusAllowed(
      { email: "buyer@example.com", orgIds: ["org-a"] },
      { email: "other@example.com", orgIds: ["org-b"] },
    ),
    false,
  );
  assert.equal(
    checkoutStatusAllowed(
      { email: "Buyer@example.com", orgIds: ["org-a"] },
      { email: "buyer@example.com", orgIds: [] },
    ),
    true,
  );
  assert.equal(
    checkoutStatusAllowed(
      { email: "coach@example.com", orgIds: ["org-a"] },
      { email: "buyer@example.com", orgIds: ["org-a"] },
    ),
    true,
  );
  assert.deepEqual(
    decideCheckoutStatus({
      secret: "sk_live_secret",
      hasPurchase: true,
      localAllowed: true,
      stripeMatches: null,
    }),
    { action: "test_mode_only" },
  );
  assert.deepEqual(
    decideCheckoutStatus({
      secret: "",
      hasPurchase: true,
      localAllowed: true,
      stripeMatches: null,
    }),
    { action: "answer" },
  );
  assert.deepEqual(
    decideCheckoutStatus({
      secret: "sk_test_secret",
      hasPurchase: true,
      localAllowed: false,
      stripeMatches: true,
    }),
    { action: "forbidden" },
  );

  let called = false;
  const live = await stripeSessionMatchesCaller({
    sessionId: "cs_test_1",
    secret: "sk_live_secret",
    caller: { email: "buyer@example.com", orgIds: ["org-a"] },
    purchaseEmail: "buyer@example.com",
    fetchImpl: async () => {
      called = true;
      return new Response("{}");
    },
  });
  assert.equal(called, false);
  assert.equal(live, false);

  const foreign = await stripeSessionMatchesCaller({
    sessionId: "cs_test_1",
    secret: "sk_test_secret",
    caller: { email: "buyer@example.com", orgIds: ["org-a"] },
    purchaseEmail: "buyer@example.com",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          id: "cs_test_1",
          livemode: false,
          customer_email: "stranger@example.com",
        }),
      ),
  });
  assert.equal(foreign, false);

  const owned = await stripeSessionMatchesCaller({
    sessionId: "cs_test_1",
    secret: "sk_test_secret",
    caller: { email: "coach@example.com", orgIds: ["org-a"] },
    purchaseEmail: "buyer@example.com",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          id: "cs_test_1",
          livemode: false,
          metadata: { org_id: "org-a" },
        }),
      ),
  });
  assert.equal(owned, true);
});
