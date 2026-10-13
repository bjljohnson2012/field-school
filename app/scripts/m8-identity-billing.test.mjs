import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import {
  jwtRevoked,
  loginIdentity,
  mergeFormSubmissions,
  recapNoteInsert,
} from "../src/lib/billing/m8-identity.ts";
import { planStripeSetup } from "../src/lib/billing/m8-stripe-setup.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const OFFER_LINE =
  "Offers are Do It Yourself, Coaching (three tiers), and Consulting; the Individual plan stays unpublished until billing runs clean 30 days. New offers need Ben.";

test("go-live flags stay false", () => {
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.match(read("src/lib/billing/checkout-destination.ts"), /export const CHECKOUT_GO_LIVE = false/);
  assert.match(read("marketing-site/js/checkout-switch.mjs"), /export const COACHING_GO_LIVE = false/);
});

test("cart and checkout redirect to pricing while checkout is off", () => {
  const cart = read("src/app/cart/page.tsx");
  const checkout = read("src/app/checkout/page.tsx");
  assert.match(cart, /redirect\("\/pricing"\)/);
  assert.match(checkout, /if \(!CHECKOUT_GO_LIVE\) redirect\("\/pricing"\)/);
  assert.match(read("src/app/pricing/page.tsx"), /Email Ben/);
  assert.match(read("src/app/pricing/page.tsx"), /consultingMailto/);
  assert.doesNotMatch(read("src/app/pricing/page.tsx"), /Learn with Ben/);
  assert.doesNotMatch(read("src/app/settings/billing/page.tsx"), /Individual/);
  assert.match(read("src/app/settings/billing/page.tsx"), /Email Ben/);
  assert.match(read("src/app/library/sessions/page.tsx"), /Next steps/);
});

test("sign-in uses Postgres when the JSON member is missing", () => {
  assert.equal(
    loginIdentity({
      jsonMember: null,
      postgresMember: { id: "pg-1", email: "a@fieldschool.ai", name: "A" },
    }),
    "postgres",
  );
  assert.equal(
    loginIdentity({
      jsonMember: { id: "json-1", email: "a@fieldschool.ai", name: "A" },
      postgresMember: { id: "pg-1", email: "a@fieldschool.ai", name: "A" },
    }),
    "json",
  );
  const auth = read("src/auth.ts");
  assert.match(auth, /if \(input\.jsonMember\)/);
  assert.match(auth, /if \(input\.credentialMember\)/);
});

test("forms keep Postgres rows and add JSON rows that are new", () => {
  assert.deepEqual(
    mergeFormSubmissions(
      [{ id: "pg", kind: "saturday_note" }],
      [
        { id: "pg", kind: "saturday_note" },
        { id: "json", kind: "topic_request" },
      ],
    ),
    [
      { id: "pg", kind: "saturday_note" },
      { id: "json", kind: "topic_request" },
    ],
  );
});

test("a revoked session id is rejected and a missing brain id does not write a note", () => {
  assert.equal(jwtRevoked("sess-1", ["sess-1"]), true);
  assert.equal(jwtRevoked("sess-2", ["sess-1"]), false);
  assert.equal(jwtRevoked("", ["sess-1"]), false);
  assert.equal(recapNoteInsert(null), null);
  assert.equal(recapNoteInsert({ brainId: "", body: "Recap" }), null);
  assert.deepEqual(recapNoteInsert({ brainId: "brain-1", body: "Recap" }), {
    title: "Coaching recap",
    body: "Recap",
  });
  assert.match(read("src/auth.ts"), /isRevokedJti/);
});

test("stripe setup refuses a live key and does not apply a charge", () => {
  const live = planStripeSetup({ key: "sk_live_prep", allowLive: false, apply: true });
  assert.deepEqual(
    { ok: live.ok, reason: live.ok ? "" : live.reason, applied: live.applied },
    { ok: false, reason: "live_key_refused", applied: false },
  );
  const testKey = planStripeSetup({ key: "sk_test_prep", allowLive: false, apply: true });
  assert.equal(testKey.ok, true);
  assert.equal(testKey.applied, false);
  if (testKey.ok) {
    assert.deepEqual(
      testKey.prices.map((price) => price.lookupKey),
      ["coaching_assess_monthly", "coaching_model_monthly", "coaching_build_monthly"],
    );
  }
});

test("stripe-setup.mjs exits 2 for a live key and 0 for a test key", () => {
  const live = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/stripe-setup.mjs"],
    {
      cwd: root,
      env: { STRIPE_SECRET_KEY: "sk_live_prep" },
      encoding: "utf8",
    },
  );
  assert.equal(live.status, 2);
  const testKey = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/stripe-setup.mjs"],
    {
      cwd: root,
      env: { STRIPE_SECRET_KEY: "sk_test_prep" },
      encoding: "utf8",
    },
  );
  assert.equal(testKey.status, 0);
  assert.match(testKey.stdout, /"applied":false/);
  assert.doesNotMatch(testKey.stdout, /sk_live_/);
});

test("migration 0023 does not backfill and keeps Individual unpublished", () => {
  const sql = read("db/0023_m8_identity_billing.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS coaching_plans/);
  assert.match(sql, /'individual', 10, 0, NULL, false/);
  assert.doesNotMatch(sql, /DELETE FROM/);
  assert.doesNotMatch(sql, /UPDATE members/);
  assert.match(read("src/app/api/stripe/webhook/route.ts"), /webhookEffect/);
});

test("migration 0024 creates the missing M8 objects and does not touch coaching_plans", () => {
  const sql = read("db/0024_m8_offer_tiers.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS m8_offer_tiers/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS coaching_records/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS auth_session_revocations/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS portal_form_submissions/);
  assert.match(sql, /'individual', 10, 0, NULL, false/);
  assert.doesNotMatch(sql, /coaching_plans/);
  assert.doesNotMatch(sql, /DROP /);
  assert.doesNotMatch(sql, /DELETE FROM/);
  assert.match(read("src/lib/billing/m8-sql.ts"), /0024_m8_offer_tiers\.sql/);
  assert.doesNotMatch(read("src/lib/billing/m8-sql.ts"), /0023_m8_identity_billing\.sql/);
  assert.equal(read("src/lib/billing/checkout-destination.ts").includes("export const CHECKOUT_GO_LIVE = false"), true);
  assert.equal(read("marketing-site/js/checkout-switch.mjs").includes("export const COACHING_GO_LIVE = false"), true);
});

test("README and LAW use the offer line and AUTH_URL stays on the portal", () => {
  const readme = readFileSync(join(repo, "README.md"), "utf8");
  const law = readFileSync(join(repo, "docs/LAW.md"), "utf8");
  assert.match(readme, new RegExp(OFFER_LINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(law, new RegExp(OFFER_LINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(readme, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.doesNotMatch(readme, /Prices \$100 \/ \$200 \/ \$1,000/);
});
