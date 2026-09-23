import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  assertCanAccessMember,
  assignableMembershipIds,
  ensureOperatorMembership,
  isGuardianOf,
  memberHasPlatformAdmin,
  stanceBackfillCapability,
} from "../src/lib/coaching/access.ts";
import { requireCoachingWrite } from "../src/lib/coaching/writes.ts";
import { deanEmail, operatorAdminPlan } from "./seed-operator-admin.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const fs = "org-fs";
const sales = "org-sales";
const household = "org-hh";
const orgB = "org-b";

const op = "member-op";
const leaderMember = "member-leader";
const idleLeaderMember = "member-idle-leader";
const coachMember = "member-coach";
const idleCoachMember = "member-idle-coach";
const learnerAMember = "member-a";
const learnerBMember = "member-b";
const orgBLearnerMember = "member-b-org";
const adminMember = "member-admin";
const guardianMember = "member-guardian";
const childMember = "member-child";

const opFs = "m-op-fs";
const opSales = "m-op-sales";
const opHh = "m-op-hh";
const leader = "m-leader";
const idleLeader = "m-idle-leader";
const coach = "m-coach";
const idleCoach = "m-idle-coach";
const coachB = "m-coach-b";
const learnerA = "m-learner-a";
const learnerB = "m-learner-b";
const learnerOrgB = "m-learner-org-b";
const salesAdmin = "m-sales-admin";
const guardian = "m-guardian";
const child = "m-child";

function row(id, orgId, memberId, stance) {
  return { id, orgId, memberId, stance };
}

function actor(membershipId, orgId, memberId, stance) {
  return { membershipId, orgId, memberId, stance };
}

const world = {
  memberships: [
    row(opFs, fs, op, "admin"),
    row(opSales, sales, op, "learner"),
    row(opHh, household, op, "learner"),
    row(leader, sales, leaderMember, "leader"),
    row(idleLeader, sales, idleLeaderMember, "leader"),
    row(coach, sales, coachMember, "coach"),
    row(idleCoach, sales, idleCoachMember, "coach"),
    row(coachB, orgB, coachMember, "coach"),
    row(learnerA, sales, learnerAMember, "learner"),
    row(learnerB, sales, learnerBMember, "learner"),
    row(learnerOrgB, orgB, orgBLearnerMember, "learner"),
    row(salesAdmin, sales, adminMember, "admin"),
    row(guardian, household, guardianMember, "guardian"),
    row(child, household, childMember, "learner"),
  ],
  capabilities: [
    { membershipId: opFs, capability: "platform_admin" },
    { membershipId: leader, capability: "leader" },
    { membershipId: idleLeader, capability: "leader" },
    { membershipId: coach, capability: "coach" },
    { membershipId: idleCoach, capability: "coach" },
    { membershipId: coachB, capability: "coach" },
    { membershipId: salesAdmin, capability: "admin" },
    { membershipId: guardian, capability: "guardian" },
  ],
  links: [
    { orgId: sales, coachMembershipId: leader, subjectMembershipId: coach, kind: "vp" },
    { orgId: sales, coachMembershipId: coach, subjectMembershipId: learnerA, kind: "director" },
    { orgId: sales, coachMembershipId: idleLeader, subjectMembershipId: idleCoach, kind: "vp" },
  ],
  wards: [
    { orgId: household, guardianMembershipId: guardian, childMembershipId: child },
  ],
};

const leaderActor = actor(leader, sales, leaderMember, "leader");
const idleLeaderActor = actor(idleLeader, sales, idleLeaderMember, "leader");
const coachActor = actor(coach, sales, coachMember, "coach");
const coachBActor = actor(coachB, orgB, coachMember, "coach");
const salesAdminActor = actor(salesAdmin, sales, adminMember, "admin");
const opSalesActor = actor(opSales, sales, op, "learner");
const guardianActor = actor(guardian, household, guardianMember, "guardian");

test("leader without a director link under the coach cannot open or assign that learner", () => {
  assert.equal(assertCanAccessMember(world, idleLeaderActor, learnerA), null);
  assert.equal(assertCanAccessMember(world, idleLeaderActor, learnerB), null);
  const tasks = assignableMembershipIds(world, idleLeaderActor);
  assert.equal(tasks.includes(learnerA), false);
  assert.equal(tasks.includes(learnerB), false);
  assert.deepEqual(new Set(tasks), new Set([idleLeader, idleCoach]));
});

test("leader opens and assigns only the reporting chain", () => {
  assert.equal(assertCanAccessMember(world, leaderActor, learnerA)?.id, learnerA);
  assert.equal(assertCanAccessMember(world, leaderActor, coach)?.id, coach);
  assert.equal(assertCanAccessMember(world, leaderActor, learnerB), null);
  assert.deepEqual(
    new Set(assignableMembershipIds(world, leaderActor)),
    new Set([leader, coach, learnerA]),
  );
});

test("coach cannot open a learner in the same org without a director link", () => {
  assert.equal(assertCanAccessMember(world, coachActor, learnerB), null);
  assert.equal(assertCanAccessMember(world, coachActor, learnerA)?.id, learnerA);
});

test("coach membership in org B with no director links cannot open org B learners", () => {
  assert.equal(assertCanAccessMember(world, coachBActor, learnerOrgB), null);
  assert.equal(assertCanAccessMember(world, coachBActor, learnerA), null);
});

test("org admin opens learners in the active org only", () => {
  assert.equal(assertCanAccessMember(world, salesAdminActor, learnerA)?.id, learnerA);
  assert.equal(assertCanAccessMember(world, salesAdminActor, learnerB)?.id, learnerB);
  assert.equal(assertCanAccessMember(world, salesAdminActor, child), null);
});

test("platform_admin on field-school opens a sales subject while the active org is sales", () => {
  assert.equal(memberHasPlatformAdmin(world, op), true);
  assert.equal(world.capabilities.some((row) => row.membershipId === opSales), false);
  assert.equal(assertCanAccessMember(world, opSalesActor, learnerA)?.id, learnerA);
  assert.equal(assertCanAccessMember(world, opSalesActor, child), null);
});

test("switch and import ensure use learner and an empty capability set off field-school", () => {
  for (const slug of ["sales", "household", "acme"]) {
    const created = ensureOperatorMembership({ slug });
    assert.equal(created.stance, "learner");
    assert.deepEqual(created.capabilities, []);
  }
  const operator = ensureOperatorMembership({ slug: "field-school" });
  assert.equal(operator.stance, "admin");
  assert.deepEqual(operator.capabilities, ["platform_admin"]);
});

test("isGuardianOf is false for the household operator row and true when stance is admin", () => {
  const created = ensureOperatorMembership({ slug: "household" });
  const identity = {
    stance: created.stance,
    orgId: household,
    membershipId: opHh,
  };
  assert.equal(created.stance, "learner");
  assert.deepEqual(created.capabilities, []);
  assert.equal(isGuardianOf(identity, child, []), false);
  assert.equal(isGuardianOf({ ...identity, stance: "admin" }, child, []), true);
  const profile = read("src/lib/pattern/profile.ts");
  assert.match(profile, /if \(actor\.stance === "admin"\) return true/);
});

test("stance backfill of admin does not satisfy memberHasPlatformAdmin", () => {
  assert.equal(stanceBackfillCapability("admin"), "admin");
  assert.equal(stanceBackfillCapability("platform_admin"), null);
  const backfill = {
    memberships: [row("m-admin", sales, "member-backfill", "admin")],
    capabilities: [{ membershipId: "m-admin", capability: "admin" }],
    links: [],
    wards: [],
  };
  assert.equal(memberHasPlatformAdmin(backfill, "member-backfill"), false);
});

test("a sales admin is not a coaching guardian; a household guardian needs a ward row", () => {
  assert.equal(assertCanAccessMember(world, salesAdminActor, child), null);
  assert.equal(assertCanAccessMember(world, guardianActor, child)?.id, child);
  const noWard = { ...world, wards: [] };
  assert.equal(assertCanAccessMember(noWard, guardianActor, child), null);
  assert.equal(isGuardianOf(guardianActor, child, noWard.wards), false);
  assert.equal(isGuardianOf(guardianActor, child, world.wards), true);
});

test("seed operator admin is DEAN_EMAIL on field-school with platform_admin only", () => {
  const plan = operatorAdminPlan();
  assert.equal(plan.email, deanEmail());
  assert.equal(plan.email, "bjljohnson2012@gmail.com");
  assert.equal(plan.orgSlug, "field-school");
  assert.equal(plan.stance, "admin");
  assert.deepEqual(plan.capabilities, ["platform_admin"]);
  const campus = read("src/lib/campus.ts");
  assert.match(campus, /export const DEAN_EMAIL = "bjljohnson2012@gmail.com"/);
});

test("requireCoachingWrite returns 403 when COACHING_WRITES is unset or 0", async () => {
  const previous = process.env.COACHING_WRITES;
  delete process.env.COACHING_WRITES;
  try {
    const unset = requireCoachingWrite();
    assert.ok(unset);
    assert.equal(unset.status, 403);
    assert.deepEqual(await unset.json(), { error: "writes_disabled" });
    const zero = requireCoachingWrite({ COACHING_WRITES: "0" });
    assert.equal(zero?.status, 403);
    assert.equal(requireCoachingWrite({ COACHING_WRITES: "1" }), null);
  } finally {
    if (previous === undefined) delete process.env.COACHING_WRITES;
    else process.env.COACHING_WRITES = previous;
  }
});

test("0005 coaching sql mirrors schema and withholds platform_admin from stance backfill", () => {
  const sql = read("db/0005_coaching.sql");
  const schema = read("src/lib/db/schema.ts");
  const tables = [
    "membership_capabilities",
    "coaching_links",
    "coaching_profiles",
    "member_credentials",
    "products",
    "questions",
    "answer_sets",
    "answers",
    "recommendations",
    "coaching_notes",
    "coaching_plans",
    "one_on_one_preps",
    "reviews",
    "review_answers",
    "work_items",
    "coaching_sources",
    "source_mappings",
    "knowledge_repos",
    "coaching_knowledge_units",
    "ad_hoc_quizzes",
    "quiz_schedules",
    "retake_requests",
    "drill_attempts",
    "performance_snapshots",
    "audit_logs",
    "legacy_ids",
  ];
  for (const name of tables) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${name}\\b`));
    assert.match(schema, new RegExp(`pgTable\\(\\s*"${name}"`));
  }
  const backfill = sql.slice(sql.indexOf("INSERT INTO membership_capabilities"));
  const statement = backfill.slice(0, backfill.indexOf(";"));
  assert.match(statement, /SELECT id, stance/);
  assert.match(statement, /WHERE stance IS DISTINCT FROM 'platform_admin'/);
  assert.match(sql, /visible_to_learner boolean NOT NULL DEFAULT false/);
  assert.doesNotMatch(sql, /ALTER TABLE learning_events/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS sources\b/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS knowledge_units\b/);
  const composer = read("db/0005_composer.sql");
  assert.match(composer, /CREATE TABLE IF NOT EXISTS sources/);
  assert.match(composer, /CREATE TABLE IF NOT EXISTS knowledge_units/);
});

test("this change leaves AUTH_URL on portal.fieldschool.ai and does not turn coaching flags on", () => {
  const api = read("src/app/docs/api/page.tsx");
  assert.match(api, /AUTH_URL is portal\.fieldschool\.ai/);
  const files = [
    "src/lib/db/schema.ts",
    "db/0005_coaching.sql",
    "src/lib/coaching/access.ts",
    "src/lib/coaching/writes.ts",
    "scripts/seed-operator-admin.mjs",
  ];
  for (const rel of files) {
    const src = read(rel);
    assert.doesNotMatch(src, /AUTH_URL\s*=/);
    assert.doesNotMatch(src, /COACHING_WRITES\s*=\s*["']1["']/);
    assert.doesNotMatch(src, /COACHING_SHELL\s*=/);
  }
});
