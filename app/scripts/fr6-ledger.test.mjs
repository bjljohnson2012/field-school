import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  assembleLedgerUnits,
  groupLedgerUnits,
  mergeStations,
  stationCovered,
  statusForStation,
} from "../src/lib/ledger/assemble.ts";
import {
  canReadLedger,
  canWriteLedger,
  parseLedgerUnitPatch,
} from "../src/lib/ledger/rules.ts";
import { canWriteIntent } from "../src/lib/intent/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0009 is a child-bound unit ledger after 0008", () => {
  const sql = read("db/0009_progress_ledgers.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS progress_ledgers/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS progress_ledger_units/);
  assert.match(sql, /parent_membership_id/);
  assert.match(sql, /child_membership_id/);
  assert.match(sql, /UNIQUE \(org_id, child_membership_id, version\)/);
  assert.match(sql, /path_id uuid REFERENCES curriculum_paths/);
  assert.match(sql, /portion_id uuid REFERENCES next_portions/);
  assert.match(sql, /intent_id uuid REFERENCES learning_intents/);
  assert.match(sql, /started_at/);
  assert.match(sql, /completed_at/);
  assert.doesNotMatch(sql, /ALTER TABLE lessons|ALTER TABLE courses|ALTER TABLE knowledge_units/);
  assert.doesNotMatch(sql, /member_profile_revisions|\/api\/chooser/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS users\b|price_/);
  assert.doesNotMatch(sql, /MBTI|Enneagram|Gallup|Wiley/);
  assert.doesNotMatch(read("db/0008_next_portions.sql"), /progress_ledgers/);
  assert.doesNotMatch(read("db/0005_composer.sql"), /child_membership_id/);
  assert.doesNotMatch(read("db/0001_wave1.sql"), /progress_ledgers/);
  assert.doesNotMatch(read("db/0002_field_pattern.sql"), /progress_ledgers/);
  assert.doesNotMatch(read("db/0003_pattern_weights.sql"), /progress_ledgers/);
});

test("family mode parent can write the ledger; child and sales cannot", () => {
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
  assert.equal(canWriteLedger(parent, false), true);
  assert.equal(canReadLedger(parent, false), true);
  assert.equal(canWriteLedger(child, false), false);
  assert.equal(canWriteLedger(child, true), false);
  assert.equal(canWriteLedger(sales, false), false);
  assert.equal(canWriteIntent(parent, false), canWriteLedger(parent, false));
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat/i);
});

test("units group into completed, in progress, and recommended next", () => {
  const path = [
    {
      id: "s1",
      title: "Reading on the farm",
      subject: "reading",
      composerLessonId: "lesson-read",
      composerUnitId: "unit-1",
    },
    {
      id: "s2",
      title: "Fractions kitchen",
      subject: "math",
      composerLessonId: "lesson-math",
      composerUnitId: null,
    },
    {
      id: "s3",
      title: "Writing a paragraph",
      subject: "writing",
      composerLessonId: null,
      composerUnitId: null,
    },
  ];
  const portion = [
    {
      title: "Fractions kitchen",
      subject: "math",
      composerLessonId: "lesson-math",
      composerUnitId: null,
      onPortion: true,
    },
  ];
  const progress = {
    welcomeWatched: true,
    eventCount: 2,
    notes: ["loves farm stories"],
    covered: ["home:welcome", "Reading on the farm"],
    started: ["Fractions kitchen"],
  };
  assert.equal(stationCovered(path[0], progress), true);
  assert.equal(statusForStation(path[0], progress), "completed");
  assert.equal(statusForStation(path[1], progress), "in_progress");
  assert.equal(statusForStation(path[2], progress), "recommended");
  const stations = mergeStations({ path, portion });
  const units = assembleLedgerUnits({ stations, progress });
  const grouped = groupLedgerUnits(units);
  assert.equal(grouped.completed[0]?.title, "Reading on the farm");
  assert.equal(grouped.inProgress[0]?.title, "Fractions kitchen");
  assert.equal(grouped.next?.title, "Writing a paragraph");
  assert.equal(grouped.recommended[0]?.title, "Writing a paragraph");
  assert.equal(parseLedgerUnitPatch({ title: "Fractions kitchen" }).title, "Fractions kitchen");
});

test("API versions live on /api/ledger and do not use session progress or chooser", () => {
  const route = read("src/app/api/ledger/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function PATCH/);
  assert.match(route, /refreshProgressLedger/);
  assert.match(route, /markLedgerUnit/);
  assert.match(route, /child_cannot_write/);
  assert.match(route, /family_mode_only/);
  assert.doesNotMatch(route, /chooseNext|\/api\/chooser|wrotePack|\/api\/progress/);
  const store = read("src/lib/ledger/store.ts");
  assert.match(store, /progressLedgers/);
  assert.match(store, /progressLedgerUnits/);
  assert.match(store, /childMembershipId: opts.childMembershipId/);
  assert.match(store, /membershipId: opts.childMembershipId/);
  assert.match(store, /actorMembershipId: opts.actor.membershipId/);
  assert.match(store, /supervised: true/);
  assert.doesNotMatch(store, /chooseNext|\/api\/chooser|memberProfileRevisions/);
  const schema = read("src/lib/db/schema.ts");
  assert.match(schema, /progressLedgers = pgTable/);
  assert.match(schema, /progressLedgerUnits = pgTable/);
  assert.match(schema, /childMembershipId: uuid\("child_membership_id"\)/);
  const childrenDb = read("src/components/children-database.tsx");
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /\/api\/ledger/);
  assert.match(childrenDb, /Progress ledger/);
  assert.match(childrenDb, /Refresh ledger/);
  assert.match(childrenDb, /Start unit/);
  assert.match(childrenDb, /Complete unit/);
  assert.match(childrenDb, /Add a child/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next|Knowledge brain|Student/);
  assert.doesNotMatch(childrenDb, /\/api\/chooser|\/api\/progress/);
  const childrenPage = read("src/app/children/page.tsx");
  assert.match(childrenPage, /<ChildrenDatabase/);
  assert.match(childrenPage, /progress ledger/);
  assert.doesNotMatch(childrenPage, /knowledge brain|Now \/ Confidence \/ Next|composer|\/teach/i);
});

test("guest Grok Bot, AUTH_URL, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /\/api\/ledger|progress_ledgers/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const progress = read("src/app/api/progress/route.ts");
  assert.match(progress, /reduceCourseProgress/);
  assert.doesNotMatch(progress, /progress_ledgers|\/api\/ledger/);
  const chooser = read("src/app/api/chooser/route.ts");
  assert.match(chooser, /chooseNext/);
  assert.doesNotMatch(chooser, /progress_ledgers|\/api\/ledger/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("deploy/deploy.sh"), /0009_progress_ledgers\.sql/);
  assert.match(read("deploy/deploy.sh"), /0008_next_portions\.sql/);
});
