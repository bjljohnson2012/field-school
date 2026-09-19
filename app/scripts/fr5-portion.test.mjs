import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  remainingStations,
  sliceNextPortion,
  horizonFromIntent,
  portionTitle,
} from "../src/lib/portion/suggest.ts";
import {
  canReadPortion,
  canWritePortion,
  parsePortionItems,
  portionHasItems,
} from "../src/lib/portion/rules.ts";
import { canWriteIntent } from "../src/lib/intent/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0008 is a child-bound next-portion store after 0007", () => {
  const sql = read("db/0008_next_portions.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS next_portions/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS next_portion_items/);
  assert.match(sql, /parent_membership_id/);
  assert.match(sql, /child_membership_id/);
  assert.match(sql, /UNIQUE \(org_id, child_membership_id, version\)/);
  assert.match(sql, /path_id uuid REFERENCES curriculum_paths/);
  assert.match(sql, /intent_id uuid REFERENCES learning_intents/);
  assert.match(sql, /horizon text/);
  assert.match(sql, /locked_at/);
  assert.doesNotMatch(sql, /ALTER TABLE lessons|ALTER TABLE courses|ALTER TABLE knowledge_units/);
  assert.doesNotMatch(sql, /learning_events|member_profile_revisions|parent-note/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS users\b|price_/);
  assert.doesNotMatch(sql, /MBTI|Enneagram|Gallup|Wiley/);
  assert.doesNotMatch(read("db/0007_curriculum_paths.sql"), /next_portions/);
  assert.doesNotMatch(read("db/0005_composer.sql"), /child_membership_id/);
  assert.doesNotMatch(read("db/0001_wave1.sql"), /next_portions/);
  assert.doesNotMatch(read("db/0002_field_pattern.sql"), /next_portions/);
  assert.doesNotMatch(read("db/0003_pattern_weights.sql"), /next_portions/);
});

test("family mode parent can write a next portion; child and sales cannot", () => {
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
  assert.equal(canWritePortion(parent, false), true);
  assert.equal(canReadPortion(parent, false), true);
  assert.equal(canWritePortion(child, false), false);
  assert.equal(canWritePortion(child, true), false);
  assert.equal(canWritePortion(sales, false), false);
  assert.equal(canWriteIntent(parent, false), canWritePortion(parent, false));
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat/i);
});

test("suggestion uses remaining accepted path plus progress, not chooser", () => {
  const path = [
    {
      id: "s1",
      sortOrder: 1,
      title: "Reading on the farm",
      subject: "reading",
      composerLessonId: "lesson-read",
      composerUnitId: "unit-1",
    },
    {
      id: "s2",
      sortOrder: 2,
      title: "Fractions kitchen",
      subject: "math",
      composerLessonId: "lesson-math",
      composerUnitId: null,
    },
    {
      id: "s3",
      sortOrder: 3,
      title: "Writing a paragraph",
      subject: "writing",
      composerLessonId: null,
      composerUnitId: null,
    },
  ];
  const remaining = remainingStations(path, {
    welcomeWatched: true,
    eventCount: 2,
    notes: ["loves farm stories"],
    covered: ["home:welcome", "Reading on the farm"],
  });
  assert.equal(remaining.some((item) => item.title === "Reading on the farm"), false);
  assert.equal(remaining[0]?.title, "Fractions kitchen");
  const week = sliceNextPortion({
    remaining,
    horizon: "week",
    intent: {
      goals: ["Keep math moving"],
      subjects: ["math", "writing"],
      themes: [],
      timeHorizon: "this week",
      constraints: [],
      tags: {},
    },
  });
  assert.equal(week.length <= 3, true);
  assert.equal(week[0]?.title, "Fractions kitchen");
  assert.equal(week[0]?.source, "remaining");
  assert.equal(horizonFromIntent({
    goals: [],
    subjects: [],
    themes: [],
    timeHorizon: "this module",
    constraints: [],
    tags: {},
  }), "module");
  assert.match(portionTitle("week", week, null), /next week: Fractions kitchen/);
  const moduleSlice = sliceNextPortion({
    remaining: path,
    horizon: "module",
    intent: {
      goals: [],
      subjects: ["reading"],
      themes: [],
      timeHorizon: "this module",
      constraints: [],
      tags: {},
    },
  });
  assert.equal(moduleSlice.every((item) => item.subject === "reading" || item.title === "Reading on the farm"), true);
  assert.equal(portionHasItems(parsePortionItems("Fractions review\nWriting")), true);
});

test("API versions live on /api/portion and do not use Pattern chooser", () => {
  const route = read("src/app/api/portion/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function PATCH/);
  assert.match(route, /suggestNextPortion/);
  assert.match(route, /lockNextPortion/);
  assert.match(route, /overrideNextPortion/);
  assert.match(route, /child_cannot_write/);
  assert.match(route, /family_mode_only/);
  assert.doesNotMatch(route, /chooseNext|\/api\/chooser|wrotePack/);
  const store = read("src/lib/portion/store.ts");
  assert.match(store, /nextPortions/);
  assert.match(store, /nextPortionItems/);
  assert.match(store, /childMembershipId: opts.childMembershipId/);
  assert.match(store, /status: "locked"/);
  assert.match(store, /status: "overridden"/);
  assert.doesNotMatch(store, /chooseNext|\/api\/chooser|memberProfileRevisions/);
  const schema = read("src/lib/db/schema.ts");
  assert.match(schema, /nextPortions = pgTable/);
  assert.match(schema, /nextPortionItems = pgTable/);
  assert.match(schema, /childMembershipId: uuid\("child_membership_id"\)/);
  const childrenDb = read("src/components/children-database.tsx");
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /\/api\/portion/);
  assert.match(childrenDb, /Next portion/);
  assert.match(childrenDb, /Suggest next portion/);
  assert.match(childrenDb, /Lock portion/);
  assert.match(childrenDb, /Override portion/);
  assert.match(childrenDb, /Add a child/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next|Knowledge brain|Student/);
  assert.doesNotMatch(childrenDb, /\/api\/chooser/);
  const childrenPage = read("src/app/children/page.tsx");
  assert.match(childrenPage, /<ChildrenDatabase/);
  assert.match(childrenPage, /next portion/);
  assert.doesNotMatch(childrenPage, /knowledge brain|Now \/ Confidence \/ Next|composer|\/teach/i);
});

test("guest Grok Bot, AUTH_URL, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /\/api\/portion|next_portions/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const chooser = read("src/app/api/chooser/route.ts");
  assert.match(chooser, /chooseNext/);
  assert.doesNotMatch(chooser, /next_portions|\/api\/portion/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("deploy/deploy.sh"), /0008_next_portions\.sql/);
  assert.match(read("deploy/deploy.sh"), /0007_curriculum_paths\.sql/);
});
