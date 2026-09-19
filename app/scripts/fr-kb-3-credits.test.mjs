import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  asCreditMode,
  asCreditUnits,
  asLedgerEventName,
  asUsageEventName,
  canReadCredits,
  canWriteCredits,
  directionForEvent,
  familyKindOrEmpty,
  moneyFieldsPresent,
} from "../src/lib/credits/rules.ts";
import { fingerprintSecret, unwrapCustomerSecret, wrapCustomerSecret } from "../src/lib/credits/crypto.ts";
import { canWriteIntent } from "../src/lib/intent/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0011 is a credits ledger and encrypted BYOK store after 0010", () => {
  const sql = read("db/0011_credits_byok.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS credits/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS credit_ledger/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS usage_events/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS customer_api_keys/);
  assert.match(sql, /parent_membership_id/);
  assert.match(sql, /wrapped_ciphertext/);
  assert.match(sql, /wrap_iv/);
  assert.match(sql, /wrap_tag/);
  assert.match(sql, /fingerprint/);
  assert.match(sql, /mode text NOT NULL DEFAULT 'platform'/);
  assert.match(sql, /credits_org_current_unique/);
  assert.match(sql, /customer_api_keys_org_active_unique/);
  assert.doesNotMatch(sql, /amount_cents|price_|usd|dollar|sku|stripe/i);
  assert.doesNotMatch(sql, /ALTER TABLE lessons|ALTER TABLE knowledge_units|ALTER TABLE growth_units/);
  assert.doesNotMatch(sql, /ALTER TABLE knowledge_brains|ALTER TABLE progress_ledgers/);
  assert.doesNotMatch(sql, /member_profile_revisions|\/api\/chooser/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS users\b/);
  assert.doesNotMatch(sql, /MBTI|Enneagram|Gallup|Wiley/);
  assert.doesNotMatch(read("db/0010_knowledge_brains.sql"), /CREATE TABLE IF NOT EXISTS credits|customer_api_keys/);
  assert.doesNotMatch(read("db/0005_composer.sql"), /credit_ledger|customer_api_keys/);
  assert.doesNotMatch(read("db/0001_wave1.sql"), /credit_ledger|customer_api_keys/);
  assert.doesNotMatch(read("db/0002_field_pattern.sql"), /credit_ledger|customer_api_keys/);
  assert.doesNotMatch(read("db/0003_pattern_weights.sql"), /credit_ledger|customer_api_keys/);
});

test("family mode parent can write credits; child, sales, and team/org cannot", () => {
  const parent = {
    kind: "adult",
    stance: "guardian",
    orgSlug: "household",
    mode: "family",
    features: { cap: false, mode: "family" },
  };
  const child = {
    kind: "child",
    stance: "learner",
    orgSlug: "household",
    mode: "none",
    features: { cap: false, mode: "family" },
  };
  const sales = {
    kind: "adult",
    stance: "trainer",
    orgSlug: "sales",
    mode: "none",
    features: { cap: false },
  };
  assert.equal(canWriteCredits(parent, false), true);
  assert.equal(canReadCredits(parent, false), true);
  assert.equal(canWriteCredits(child, false), false);
  assert.equal(canWriteCredits(child, true), false);
  assert.equal(canWriteCredits(sales, false), false);
  assert.equal(canWriteIntent(parent, false), canWriteCredits(parent, false));
  assert.equal(familyKindOrEmpty("family"), "family");
  assert.equal(familyKindOrEmpty("child"), "child");
  assert.equal(familyKindOrEmpty("team"), "blocked");
  assert.equal(familyKindOrEmpty("org"), "blocked");
  assert.equal(familyKindOrEmpty("person"), "blocked");
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat/i);
  assert.doesNotMatch(plans, /credits|BYOK|customer_api_keys/);
});

test("event names exist without prices; money fields wait Revenue", () => {
  assert.equal(asCreditMode("platform"), "platform");
  assert.equal(asCreditMode("byok"), "byok");
  assert.equal(asCreditMode("paid"), "");
  assert.equal(asLedgerEventName("monthly_grant"), "monthly_grant");
  assert.equal(asLedgerEventName("usage_burn"), "usage_burn");
  assert.equal(asLedgerEventName("adjustment"), "adjustment");
  assert.equal(asLedgerEventName("mode_switch"), "mode_switch");
  assert.equal(asUsageEventName("brain_write"), "brain_write");
  assert.equal(asUsageEventName("brain_sync"), "brain_sync");
  assert.equal(directionForEvent("usage_burn"), "burn");
  assert.equal(directionForEvent("monthly_grant"), "grant");
  assert.equal(asCreditUnits(0), 0);
  assert.equal(asCreditUnits(3), 3);
  assert.equal(asCreditUnits(-1), null);
  assert.equal(asCreditUnits(1.5), null);
  assert.equal(moneyFieldsPresent({ units: 3 }), false);
  assert.equal(moneyFieldsPresent({ amount: 1 }), true);
  assert.equal(moneyFieldsPresent({ stripe_price_id: "price_x" }), true);
  const rules = read("src/lib/credits/rules.ts");
  assert.doesNotMatch(rules, /\$\d|priceLabel|buy\.stripe/);
  const store = read("src/lib/credits/store.ts");
  assert.match(store, /amounts_wait_revenue/);
  assert.match(store, /byok_monthly_only/);
  assert.match(store, /byok_key_required/);
  assert.match(store, /family_mode_only/);
  assert.doesNotMatch(store, /checkout\.sessions|payment_intent|STRIPE_SECRET/);
  assert.doesNotMatch(store, /chooseNext|\/api\/chooser|memberProfileRevisions/);
});

test("BYOK wrap is envelope-at-rest and never returns plaintext on the public key", () => {
  const env = { BYOK_WRAP_KEY: "0".repeat(64) };
  const secret = "sk-customer-fixture-abcd";
  const wrapped = wrapCustomerSecret(secret, env);
  assert.equal(wrapped.wrapAlg, "aes-256-gcm");
  assert.equal(wrapped.wrapKid, "v1");
  assert.equal(wrapped.last4, "abcd");
  assert.equal(wrapped.fingerprint, fingerprintSecret(secret));
  assert.notEqual(wrapped.wrappedCiphertext, secret);
  assert.equal(unwrapCustomerSecret(wrapped, env), secret);
  const store = read("src/lib/credits/store.ts");
  assert.match(store, /wrapCustomerSecret/);
  assert.match(store, /publicKeyMeta/);
  assert.match(store, /wrappedCiphertext: ""/);
  assert.doesNotMatch(store, /return \{[^}]*secret/);
  const keys = read("src/app/api/keys/route.ts");
  assert.match(keys, /listKeys/);
  assert.match(keys, /writeCustomerKey/);
  assert.match(keys, /revokeCustomerKey/);
  assert.doesNotMatch(keys, /unwrapActiveCustomerKey|unwrapCustomerSecret/);
  assert.doesNotMatch(keys, /RESEND_API_KEY|STRIPE_WEBHOOK_SECRET/);
});

test("API lives on /api/credits and /api/keys and does not add Wave 2 or family chrome", () => {
  const credits = read("src/app/api/credits/route.ts");
  assert.match(credits, /export async function GET/);
  assert.match(credits, /export async function POST/);
  assert.match(credits, /writeCredits/);
  assert.match(credits, /child_cannot_write/);
  assert.match(credits, /family_mode_only/);
  assert.doesNotMatch(credits, /chooseNext|\/api\/chooser|wrotePack|\/api\/progress/);
  const keys = read("src/app/api/keys/route.ts");
  assert.match(keys, /export async function GET/);
  assert.match(keys, /export async function POST/);
  assert.match(keys, /export async function DELETE/);
  const schema = read("src/lib/db/schema.ts");
  assert.match(schema, /credits = pgTable/);
  assert.match(schema, /creditLedger = pgTable/);
  assert.match(schema, /usageEvents = pgTable/);
  assert.match(schema, /customerApiKeys = pgTable/);
  assert.match(schema, /wrappedCiphertext: text\("wrapped_ciphertext"\)/);
  const childrenDb = read("src/components/children-database.tsx");
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /Add a child/);
  assert.doesNotMatch(childrenDb, /\/api\/credits|\/api\/keys|customer_api_keys/);
  const home = read("src/components/family-v1-home.tsx");
  assert.match(home, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(home, /\/api\/credits|\/api\/keys/);
  const childrenPage = read("src/app/children/page.tsx");
  assert.doesNotMatch(childrenPage, /\/api\/credits|\/api\/keys|BYOK/);
});

test("guest Grok Bot, AUTH_URL, Stripe seats, factory, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /\/api\/credits|\/api\/keys|customer_api_keys/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const progress = read("src/app/api/progress/route.ts");
  assert.match(progress, /reduceCourseProgress/);
  assert.doesNotMatch(progress, /\/api\/credits|customer_api_keys/);
  const chooser = read("src/app/api/chooser/route.ts");
  assert.match(chooser, /chooseNext/);
  const billing = read("src/lib/billing/plans.ts");
  assert.doesNotMatch(billing, /credits|BYOK|customer_api_keys|growth_unit/);
  const webhook = read("src/lib/billing/stripe-webhook.ts");
  assert.doesNotMatch(webhook, /credits|BYOK|customer_api_keys|writeCredits/);
  const fulfill = read("src/lib/billing/fulfill.ts");
  assert.doesNotMatch(fulfill, /credits|BYOK|customer_api_keys|writeCredits/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("AUTH.md"), /AUTH_URL.*https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("AUTH.md"), /BYOK_WRAP_KEY/);
  assert.match(read("deploy/deploy.sh"), /0011_credits_byok\.sql/);
  assert.match(read("deploy/deploy.sh"), /0010_knowledge_brains\.sql/);
  assert.equal(existsSync(join(root, "db/0011_family_v1.sql")), false);
  assert.equal(existsSync(join(root, "db/0011_brain_sync.sql")), false);
  assert.doesNotMatch(read("db/0011_credits_byok.sql"), /2\.24\.64\.248|27pn9xs0zk8a73g/);
  assert.doesNotMatch(read("src/lib/credits/store.ts"), /vite\.config|migrations\/0001/);
  assert.doesNotMatch(read("src/components/family-v1-home.tsx"), /\/api\/credits|\/api\/keys/);
});
