import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  campusSynced,
  campusUri,
  canReadBrain,
  canWriteBrain,
  isCampusUri,
  isFamilyFirstKind,
} from "../src/lib/brain/rules.ts";
import { campusSnapshotBags, materializeCampusDrafts } from "../src/lib/brain/sync.ts";
import { canWriteIntent } from "../src/lib/intent/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

function childBundle() {
  return {
    kind: "child",
    intent: {
      id: "intent-1",
      version: 2,
      goals: ["Read fluently"],
      subjects: ["reading"],
      themes: ["farm life"],
      timeHorizon: "week",
      constraints: ["mornings"],
      tags: { next: ["fractions"] },
    },
    path: {
      id: "path-1",
      version: 3,
      status: "accepted",
      intentId: "intent-1",
      items: [
        {
          id: "path-item-1",
          title: "Reading on the farm",
          subject: "reading",
          reason: "matches intent",
          source: "intent",
          composerLessonId: "lesson-1",
          composerUnitId: "unit-1",
        },
      ],
    },
    portion: {
      id: "portion-1",
      version: 1,
      status: "locked",
      pathId: "path-1",
      intentId: "intent-1",
      horizon: "week",
      title: "This week",
      items: [
        {
          id: "portion-item-1",
          title: "Reading on the farm",
          subject: "reading",
          reason: "remaining",
          source: "remaining",
          composerLessonId: "lesson-1",
          composerUnitId: "unit-1",
        },
      ],
    },
    ledger: {
      id: "ledger-1",
      version: 4,
      pathId: "path-1",
      portionId: "portion-1",
      intentId: "intent-1",
      summary: { completed: 1, inProgress: 0, recommended: 0 },
      units: [
        {
          id: "ledger-unit-1",
          title: "Reading on the farm",
          subject: "reading",
          reason: "",
          source: "refresh",
          status: "completed",
          confidence: "ready",
          composerLessonId: "lesson-1",
          composerUnitId: "unit-1",
        },
      ],
    },
    notes: [{ id: "event-1", body: "loves farm stories" }],
    catalog: [
      {
        lessonId: "lesson-1",
        sourceId: "source-1",
        unitId: "unit-1",
        title: "Farm journal",
        body: "wheat notes",
        url: "",
      },
    ],
  };
}

test("sync lives in existing 0010 brain tables and does not add 0011", () => {
  const files = readdirSync(join(root, "db"));
  assert.ok(files.includes("0010_knowledge_brains.sql"));
  assert.equal(files.some((name) => /^0011_/.test(name)), false);
  const sql = read("db/0010_knowledge_brains.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS growth_units/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS knowledge_brains/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS brain_sources/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS brain_notes/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS brain_artifacts/);
  assert.doesNotMatch(sql, /ALTER TABLE learning_intents|ALTER TABLE curriculum_paths/);
  assert.doesNotMatch(sql, /ALTER TABLE next_portions|ALTER TABLE progress_ledgers/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS credits|customer_api_keys|BYOK/);
  assert.doesNotMatch(read("db/0006_learning_intents.sql"), /knowledge_brains|growth_units/);
  assert.doesNotMatch(read("db/0007_curriculum_paths.sql"), /knowledge_brains|growth_units/);
  assert.doesNotMatch(read("db/0008_next_portions.sql"), /knowledge_brains|growth_units/);
  assert.doesNotMatch(read("db/0009_progress_ledgers.sql"), /knowledge_brains|growth_units/);
  assert.doesNotMatch(read("db/0005_composer.sql"), /child_membership_id/);
});

test("family mode parent can sync; child, sales, and team/org cannot", () => {
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
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat/i);
});

test("campus objects become snapshot bags and campus:// items", () => {
  const bags = campusSnapshotBags(childBundle());
  assert.equal(bags.intent.id, "intent-1");
  assert.deepEqual(bags.intent.goals, ["Read fluently"]);
  assert.equal(bags.paths.pathId, "path-1");
  assert.equal(bags.paths.portionId, "portion-1");
  assert.equal(bags.progress.ledgerId, "ledger-1");
  assert.equal(bags.progress.completed, 1);
  assert.deepEqual(bags.synced, campusSynced({
    intent: true,
    path: true,
    portion: true,
    ledger: true,
    parentNotes: 1,
    catalog: 1,
  }));
  const drafts = materializeCampusDrafts(childBundle());
  assert.equal(drafts.notes[0]?.uri, campusUri("intent", "intent-1"));
  assert.equal(drafts.notes[1]?.title, "Parent note");
  assert.equal(drafts.notes[1]?.body, "loves farm stories");
  assert.equal(drafts.sources[0]?.title, "Farm journal");
  assert.equal(drafts.sources[0]?.composerSourceId, "source-1");
  assert.equal(drafts.artifacts.some((item) => item.uri === campusUri("path-item", "path-item-1")), true);
  assert.equal(drafts.artifacts.some((item) => item.uri === campusUri("portion-item", "portion-item-1")), true);
  assert.equal(drafts.artifacts.some((item) => item.uri === campusUri("ledger-unit", "ledger-unit-1")), true);
  assert.equal(isCampusUri(drafts.notes[0]?.uri), true);
  assert.equal(isCampusUri("https://example.test/farm"), false);
  const family = campusSnapshotBags({
    kind: "family",
    intent: null,
    path: null,
    portion: null,
    ledger: null,
    notes: [],
    catalog: [],
  });
  assert.equal(family.paths.kind, "family");
  assert.equal(family.synced.intent, false);
});

test("API sync lives on /api/brain/sync and reuses FR-3 through FR-6 plus FR-KB-1", () => {
  const route = read("src/app/api/brain/sync/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /previewCampusSync/);
  assert.match(route, /syncKnowledgeBrain/);
  assert.match(route, /child_cannot_write/);
  assert.match(route, /family_mode_only/);
  assert.doesNotMatch(route, /chooseNext|\/api\/chooser|wrotePack|\/api\/progress/);
  assert.doesNotMatch(route, /credits|BYOK|customer_api_keys/);
  const store = read("src/lib/brain/store.ts");
  assert.match(store, /syncKnowledgeBrain/);
  assert.match(store, /previewCampusSync/);
  assert.match(store, /collectCampusObjects/);
  assert.match(store, /keepParentAuthored/);
  assert.match(store, /isCampusUri/);
  assert.match(store, /family_mode_only/);
  assert.doesNotMatch(store, /chooseNext|\/api\/chooser|memberProfileRevisions/);
  assert.doesNotMatch(store, /credits|BYOK|customer_api_keys/);
  const sync = read("src/lib/brain/sync.ts");
  assert.match(sync, /learningIntents/);
  assert.match(sync, /curriculumPaths/);
  assert.match(sync, /nextPortions/);
  assert.match(sync, /progressLedgers/);
  assert.match(sync, /parent-note/);
  assert.match(sync, /status, "accepted"/);
  assert.match(sync, /status === "locked"/);
  assert.doesNotMatch(sync, /memberProfileRevisions|\/api\/chooser|GET \/api\/progress/);
  assert.doesNotMatch(sync, /credits|BYOK|customer_api_keys/);
});

test("sync adds no Wave 2 chrome, no /children changes, and no select-unit UX", () => {
  const childrenDb = read("src/components/children-database.tsx");
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /Add a child/);
  assert.match(childrenDb, /Learning intent/);
  assert.match(childrenDb, /Curriculum path/);
  assert.match(childrenDb, /Next portion/);
  assert.match(childrenDb, /Progress ledger/);
  assert.doesNotMatch(childrenDb, /Knowledge brain|\/api\/brain|Student|select-unit|growth unit/i);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  const childrenPage = read("src/app/children/page.tsx");
  assert.match(childrenPage, /<ChildrenDatabase/);
  assert.match(childrenPage, /progress ledger/);
  assert.doesNotMatch(childrenPage, /knowledge brain|\/api\/brain\/sync|Now \/ Confidence \/ Next|composer|\/teach/i);
  const childrenApi = read("src/app/api/children/route.ts");
  assert.match(childrenApi, /login: "none"/);
  assert.doesNotMatch(childrenApi, /\/api\/brain|knowledge_brains|growth_units/);
});

test("guest Grok Bot, AUTH_URL, metering, factory, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /\/api\/brain\/sync|knowledge_brains|growth_units/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const progress = read("src/app/api/progress/route.ts");
  assert.match(progress, /reduceCourseProgress/);
  assert.doesNotMatch(progress, /\/api\/brain\/sync/);
  const chooser = read("src/app/api/chooser/route.ts");
  assert.match(chooser, /chooseNext/);
  assert.doesNotMatch(chooser, /\/api\/brain\/sync/);
  const billing = read("src/lib/billing/plans.ts");
  assert.doesNotMatch(billing, /credits|BYOK|customer_api_keys|growth_unit/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("deploy/deploy.sh"), /0010_knowledge_brains\.sql/);
  assert.equal(existsSync(join(root, "db/0011_brain_sync.sql")), false);
  assert.doesNotMatch(read("src/lib/brain/sync.ts"), /2\.24\.64\.248|27pn9xs0zk8a73g|Remotion|VOX/);
  assert.doesNotMatch(read("src/lib/brain/store.ts"), /vite\.config|migrations\/0001/);
  assert.doesNotMatch(read("src/app/api/brain/sync/route.ts"), /vite\.config|migrations\/0001/);
});
