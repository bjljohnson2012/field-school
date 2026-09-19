import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  asGrowthKind,
  asSnapshotBag,
  asTitle,
  brainSummary,
  canReadBrain,
  canWriteBrain,
  isFamilyFirstKind,
  parseBrainItems,
} from "../src/lib/brain/rules.ts";
import { canWriteIntent } from "../src/lib/intent/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0010 is a family-first brain store after 0009", () => {
  const sql = read("db/0010_knowledge_brains.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS growth_units/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS knowledge_brains/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS brain_sources/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS brain_notes/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS brain_artifacts/);
  assert.match(sql, /parent_membership_id/);
  assert.match(sql, /child_membership_id/);
  assert.match(sql, /UNIQUE \(org_id, growth_unit_id, version\)/);
  assert.match(sql, /kind = 'child'/);
  assert.match(sql, /kind = 'family'/);
  assert.match(sql, /intent jsonb/);
  assert.match(sql, /paths jsonb/);
  assert.match(sql, /progress jsonb/);
  assert.doesNotMatch(sql, /ALTER TABLE lessons|ALTER TABLE courses|ALTER TABLE knowledge_units/);
  assert.doesNotMatch(sql, /ALTER TABLE progress_ledgers|ALTER TABLE learning_intents/);
  assert.doesNotMatch(sql, /member_profile_revisions|\/api\/chooser/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS users\b|price_|credits|customer_api_keys/);
  assert.doesNotMatch(sql, /MBTI|Enneagram|Gallup|Wiley/);
  assert.doesNotMatch(read("db/0009_progress_ledgers.sql"), /knowledge_brains|growth_units/);
  assert.doesNotMatch(read("db/0005_composer.sql"), /child_membership_id/);
  assert.doesNotMatch(read("db/0001_wave1.sql"), /knowledge_brains|growth_units/);
  assert.doesNotMatch(read("db/0002_field_pattern.sql"), /knowledge_brains|growth_units/);
  assert.doesNotMatch(read("db/0003_pattern_weights.sql"), /knowledge_brains|growth_units/);
});

test("family mode parent can write the brain; child, sales, and team/org cannot", () => {
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
  assert.equal(canWriteBrain(parent, false), true);
  assert.equal(canReadBrain(parent, false), true);
  assert.equal(canWriteBrain(child, false), false);
  assert.equal(canWriteBrain(child, true), false);
  assert.equal(canWriteBrain(sales, false), false);
  assert.equal(canWriteIntent(parent, false), canWriteBrain(parent, false));
  assert.equal(isFamilyFirstKind("child"), true);
  assert.equal(isFamilyFirstKind("family"), true);
  assert.equal(isFamilyFirstKind("team"), false);
  assert.equal(isFamilyFirstKind("org"), false);
  assert.equal(isFamilyFirstKind("person"), false);
  assert.equal(asGrowthKind("team"), "team");
  assert.equal(asGrowthKind("widget"), "");
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat/i);
});

test("items and snapshot bags stay private payloads, not composer or Pattern", () => {
  const items = parseBrainItems([
    { title: "Farm journal", body: "wheat notes", uri: "https://example.test/farm" },
    { title: "  " },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, "Farm journal");
  assert.equal(asTitle("  Child brain  "), "Child brain");
  assert.deepEqual(asSnapshotBag({ id: "intent-1", goals: ["read"] }).goals, ["read"]);
  assert.deepEqual(brainSummary({ sources: 1, notes: 2, artifacts: 0 }), {
    sources: 1,
    notes: 2,
    artifacts: 0,
  });
  const store = read("src/lib/brain/store.ts");
  assert.match(store, /growthUnits/);
  assert.match(store, /knowledgeBrains/);
  assert.match(store, /brainSources/);
  assert.match(store, /brainNotes/);
  assert.match(store, /brainArtifacts/);
  assert.match(store, /childMembershipId: unit.childMembershipId/);
  assert.match(store, /kind === "child"/);
  assert.match(store, /kind === "family"/);
  assert.match(store, /family_mode_only/);
  assert.match(store, /child_membership_id_required/);
  assert.doesNotMatch(store, /chooseNext|\/api\/chooser|memberProfileRevisions/);
  assert.doesNotMatch(store, /credits|BYOK|customer_api_keys/);
});

test("API versions live on /api/brain and do not add Wave 2 chrome", () => {
  const route = read("src/app/api/brain/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function DELETE/);
  assert.match(route, /writeKnowledgeBrain/);
  assert.match(route, /deleteKnowledgeBrain/);
  assert.match(route, /child_cannot_write/);
  assert.match(route, /family_mode_only/);
  assert.doesNotMatch(route, /chooseNext|\/api\/chooser|wrotePack|\/api\/progress/);
  const exported = read("src/app/api/brain/export/route.ts");
  assert.match(exported, /exportKnowledgeBrain/);
  assert.match(exported, /growth_unit_id_required/);
  const schema = read("src/lib/db/schema.ts");
  assert.match(schema, /growthUnits = pgTable/);
  assert.match(schema, /knowledgeBrains = pgTable/);
  assert.match(schema, /brainSources = pgTable/);
  assert.match(schema, /brainNotes = pgTable/);
  assert.match(schema, /brainArtifacts = pgTable/);
  assert.match(schema, /childMembershipId: uuid\("child_membership_id"\)/);
  const childrenDb = read("src/components/children-database.tsx");
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /Add a child/);
  assert.doesNotMatch(childrenDb, /Knowledge brain|\/api\/brain|Student/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  const childrenPage = read("src/app/children/page.tsx");
  assert.match(childrenPage, /<ChildrenDatabase/);
  assert.match(childrenPage, /progress ledger/);
  assert.doesNotMatch(childrenPage, /knowledge brain|Now \/ Confidence \/ Next|composer|\/teach/i);
});

test("guest Grok Bot, AUTH_URL, metering, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /\/api\/brain|knowledge_brains|growth_units/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const progress = read("src/app/api/progress/route.ts");
  assert.match(progress, /reduceCourseProgress/);
  assert.doesNotMatch(progress, /knowledge_brains|\/api\/brain/);
  const chooser = read("src/app/api/chooser/route.ts");
  assert.match(chooser, /chooseNext/);
  assert.doesNotMatch(chooser, /knowledge_brains|\/api\/brain/);
  const billing = read("src/lib/billing/plans.ts");
  assert.doesNotMatch(billing, /credits|BYOK|customer_api_keys|growth_unit/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("deploy/deploy.sh"), /0010_knowledge_brains\.sql/);
  assert.match(read("deploy/deploy.sh"), /0009_progress_ledgers\.sql/);
  assert.doesNotMatch(read("db/0010_knowledge_brains.sql"), /2\.24\.64\.248|27pn9xs0zk8a73g/);
  assert.doesNotMatch(read("src/lib/brain/store.ts"), /vite\.config|migrations\/0001/);
});
