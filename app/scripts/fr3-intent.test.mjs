import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  canReadIntent,
  canWriteIntent,
  intentHasPlanFields,
  mergeIntentFields,
  parseIntentFields,
} from "../src/lib/intent/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0006 is a versioned learning_intents store, not notes or Pattern revisions", () => {
  const sql = read("db/0006_learning_intents.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS learning_intents/);
  assert.match(sql, /parent_membership_id/);
  assert.match(sql, /child_membership_id/);
  assert.match(sql, /UNIQUE \(org_id, child_membership_id, version\)/);
  assert.match(sql, /goals jsonb/);
  assert.match(sql, /subjects jsonb/);
  assert.match(sql, /themes jsonb/);
  assert.match(sql, /time_horizon/);
  assert.match(sql, /constraints jsonb/);
  assert.match(sql, /tags jsonb/);
  assert.match(sql, /members ADD COLUMN IF NOT EXISTS mode/);
  assert.match(sql, /'"mode":"family"'/);
  assert.doesNotMatch(sql, /learning_events|parent-note|member_profile_revisions/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS users\b|child seat|price_/);
  assert.doesNotMatch(sql, /MBTI|Enneagram|Gallup|Wiley/);
});

test("family mode is a parent User flag, not a fourth SKU", () => {
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
  const learner = {
    kind: "adult",
    stance: "learner",
    orgSlug: "household",
    mode: "family",
    features: { cap: false, mode: "family" },
  };
  assert.equal(canWriteIntent(parent, false), true);
  assert.equal(canReadIntent(parent, false), true);
  assert.equal(canWriteIntent(child, false), false);
  assert.equal(canWriteIntent(child, true), false);
  assert.equal(canWriteIntent(sales, false), false);
  assert.equal(canWriteIntent(learner, false), false);
  assert.equal(
    canWriteIntent({ ...parent, stance: "guardian", mode: "none", features: { cap: false } }, true),
    true,
  );
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat/i);
});

test("intent fields are enough to regenerate a plan and keep FR-4 tags inert", () => {
  const parsed = parseIntentFields({
    goals: "Read fluently\nWrite a paragraph",
    subjects: ["reading", "writing"],
    themes: "farm life",
    time_horizon: "this term",
    constraints: "no screens before noon",
    tags: { knowledge: ["fractions"], confidence: "getting_there", next: ["review"], extra: "drop" },
  });
  assert.deepEqual(parsed.goals, ["Read fluently", "Write a paragraph"]);
  assert.deepEqual(parsed.subjects, ["reading", "writing"]);
  assert.deepEqual(parsed.themes, ["farm life"]);
  assert.equal(parsed.timeHorizon, "this term");
  assert.deepEqual(parsed.constraints, ["no screens before noon"]);
  assert.deepEqual(parsed.tags, {
    knowledge: ["fractions"],
    confidence: "getting_there",
    next: ["review"],
  });
  assert.equal(intentHasPlanFields(parsed), true);
  const merged = mergeIntentFields(parsed, parseIntentFields({ subjects: "math" }));
  assert.deepEqual(merged.subjects, ["math"]);
  assert.deepEqual(merged.goals, parsed.goals);
  assert.equal(intentHasPlanFields(parseIntentFields({})), false);
});

test("API versions live on /api/intent and stay off notes, Pattern, and brain UI", () => {
  const route = read("src/app/api/intent/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function PATCH/);
  assert.match(route, /listIntentVersions/);
  assert.match(route, /writeIntentVersion/);
  assert.match(route, /child_cannot_write/);
  assert.match(route, /family_mode_only/);
  assert.doesNotMatch(route, /learningEvents|memberProfileRevisions|parent-note/);
  const store = read("src/lib/intent/store.ts");
  assert.match(store, /learningIntents/);
  assert.match(store, /parentMembershipId/);
  assert.match(store, /childMembershipId/);
  assert.doesNotMatch(store, /learningEvents|memberProfileRevisions/);
  const childrenDb = read("src/components/children-database.tsx");
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /\/api\/intent/);
  assert.match(childrenDb, /Learning intent/);
  assert.match(childrenDb, /Save intent version/);
  assert.match(childrenDb, /Add a child/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next|Knowledge brain|Student/);
  const childrenPage = read("src/app/children/page.tsx");
  assert.match(childrenPage, /<ChildrenDatabase/);
  assert.doesNotMatch(childrenPage, /knowledge brain|Now \/ Confidence \/ Next/i);
});

test("guest Grok Bot, AUTH_URL, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /\/api\/intent|learning_intents/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("deploy/deploy.sh"), /0006_learning_intents\.sql/);
  assert.doesNotMatch(read("db/0001_wave1.sql"), /learning_intents/);
  assert.doesNotMatch(read("db/0002_field_pattern.sql"), /learning_intents/);
  assert.doesNotMatch(read("db/0003_pattern_weights.sql"), /learning_intents/);
});
