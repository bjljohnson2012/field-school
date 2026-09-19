import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assemblePathItems } from "../src/lib/curriculum/assemble.ts";
import {
  canReadCurriculum,
  canWriteCurriculum,
  parsePathItems,
  pathHasItems,
} from "../src/lib/curriculum/rules.ts";
import { canWriteIntent } from "../src/lib/intent/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0007 is a child-bound path store and 0005 stays org authoring", () => {
  const sql = read("db/0007_curriculum_paths.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS curriculum_paths/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS curriculum_path_items/);
  assert.match(sql, /parent_membership_id/);
  assert.match(sql, /child_membership_id/);
  assert.match(sql, /UNIQUE \(org_id, child_membership_id, version\)/);
  assert.match(sql, /composer_lesson_id uuid/);
  assert.match(sql, /composer_unit_id uuid/);
  assert.match(sql, /intent_id uuid REFERENCES learning_intents/);
  assert.doesNotMatch(sql, /ALTER TABLE lessons|ALTER TABLE courses|ALTER TABLE knowledge_units/);
  assert.doesNotMatch(sql, /learning_events|member_profile_revisions|parent-note/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS users\b|price_/);
  assert.doesNotMatch(sql, /MBTI|Enneagram|Gallup|Wiley/);
  const composer = read("db/0005_composer.sql");
  assert.doesNotMatch(composer, /child_membership_id/);
  assert.match(composer, /created_by_membership_id/);
  assert.doesNotMatch(read("db/0001_wave1.sql"), /curriculum_paths/);
  assert.doesNotMatch(read("db/0002_field_pattern.sql"), /curriculum_paths/);
  assert.doesNotMatch(read("db/0003_pattern_weights.sql"), /curriculum_paths/);
});

test("family mode parent can write a child path; child and sales cannot", () => {
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
  assert.equal(canWriteCurriculum(parent, false), true);
  assert.equal(canReadCurriculum(parent, false), true);
  assert.equal(canWriteCurriculum(child, false), false);
  assert.equal(canWriteCurriculum(child, true), false);
  assert.equal(canWriteCurriculum(sales, false), false);
  assert.equal(canWriteIntent(parent, false), canWriteCurriculum(parent, false));
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat/i);
});

test("assembly binds matching catalog lessons to the child path, not the org catalog", () => {
  const items = assemblePathItems({
    intent: {
      goals: ["Read fluently"],
      subjects: ["reading", "fractions"],
      themes: ["farm life"],
      timeHorizon: "this term",
      constraints: ["no screens before noon"],
      tags: {},
    },
    progress: {
      welcomeWatched: true,
      eventCount: 1,
      notes: ["loves farm stories"],
      covered: ["home:welcome"],
      priorTitles: [],
    },
    catalog: [
      {
        id: "lesson-read",
        title: "Reading on the farm",
        courseTitle: "Home reading",
        status: "published",
        units: [{ id: "unit-1", title: "Letters" }],
      },
      {
        id: "lesson-math",
        title: "Fractions kitchen",
        courseTitle: "Home math",
        status: "published",
        units: [],
      },
    ],
  });
  assert.equal(items.some((item) => item.composerLessonId === "lesson-read"), true);
  assert.equal(items.some((item) => item.composerLessonId === "lesson-math"), true);
  assert.equal(
    items.every((item) => item.kind === "station" && item.title),
    true,
  );
  assert.equal(
    items.find((item) => item.composerLessonId === "lesson-read")?.source,
    "catalog",
  );
  const skipped = assemblePathItems({
    intent: {
      goals: [],
      subjects: ["reading"],
      themes: [],
      timeHorizon: "",
      constraints: [],
      tags: {},
    },
    progress: {
      welcomeWatched: false,
      eventCount: 0,
      notes: [],
      covered: ["Reading on the farm"],
      priorTitles: [],
    },
    catalog: [
      {
        id: "lesson-read",
        title: "Reading on the farm",
        courseTitle: "Home reading",
        status: "published",
        units: [],
      },
    ],
  });
  assert.equal(skipped.some((item) => item.composerLessonId === "lesson-read"), false);
  assert.equal(pathHasItems(parsePathItems("Fractions\nWriting")), true);
});

test("API versions live on /api/curriculum and bind items to child_membership_id", () => {
  const route = read("src/app/api/curriculum/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function PATCH/);
  assert.match(route, /proposeCurriculumPath/);
  assert.match(route, /acceptCurriculumPath/);
  assert.match(route, /editCurriculumPath/);
  assert.match(route, /child_cannot_write/);
  assert.match(route, /family_mode_only/);
  assert.match(route, /action === "re-prompt"/);
  const store = read("src/lib/curriculum/store.ts");
  assert.match(store, /curriculumPaths/);
  assert.match(store, /curriculumPathItems/);
  assert.match(store, /childMembershipId: opts.childMembershipId/);
  assert.match(store, /composerLessonId: item.composerLessonId/);
  assert.doesNotMatch(store, /learningEvents\.insert|memberProfileRevisions/);
  const schema = read("src/lib/db/schema.ts");
  assert.match(schema, /curriculumPaths = pgTable/);
  assert.match(schema, /curriculumPathItems = pgTable/);
  assert.match(schema, /childMembershipId: uuid\("child_membership_id"\)/);
  const childrenDb = read("src/components/children-database.tsx");
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /\/api\/curriculum/);
  assert.match(childrenDb, /Curriculum path/);
  assert.match(childrenDb, /Propose path/);
  assert.match(childrenDb, /Accept path/);
  assert.match(childrenDb, /Save edited path/);
  assert.match(childrenDb, /Re-prompt path/);
  assert.match(childrenDb, /Add a child/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next|Knowledge brain|Student/);
  const childrenPage = read("src/app/children/page.tsx");
  assert.match(childrenPage, /<ChildrenDatabase/);
  assert.doesNotMatch(childrenPage, /knowledge brain|Now \/ Confidence \/ Next|composer|\/teach/i);
});

test("guest Grok Bot, AUTH_URL, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /\/api\/curriculum|curriculum_paths/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("deploy/deploy.sh"), /0007_curriculum_paths\.sql/);
  assert.match(read("deploy/deploy.sh"), /0006_learning_intents\.sql/);
});
