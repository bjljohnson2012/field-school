import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { individualIsPublic } from "../src/lib/billing/m8-prep.ts";
import { individualOffer, individualPlanName, offerDisplayNames, pricingVisibleText } from "../src/lib/billing/offer-names.ts";
import { asUsageEventName } from "../src/lib/credits/rules.ts";
import { INDIVIDUAL_PLAN_CONFIG, burnEventForState, burnUnits, readIndividualPlan } from "../src/lib/individual/config.ts";
import { INDIVIDUAL_PLAN_FLAG } from "../src/lib/individual/enabled.ts";
import {
  adultMaySelfRate,
  applyBurn,
  copyWithConsent,
  diffItems,
  monthlyGrant,
  openPlan,
  reshapePlan,
  uploadAllowed,
  withinCount,
} from "../src/lib/individual/plan.ts";
import { billingPublicPayload, flagOffBodies, leaksHiddenPlan, planPublicPayload } from "../src/lib/individual/surface.ts";
import { scriptedIndividualToFirstCta } from "../src/lib/individual/walk.ts";
import { nextOrgKind } from "../src/lib/onboarding/graph.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import { MEMBER_RAIL_DEFAULT, M9_METRICS, memberDoors } from "../src/lib/shell/m9-shell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const off = { INDIVIDUAL_PLAN_ENABLED: "false" };
const on = { INDIVIDUAL_PLAN_ENABLED: "true" };

test("provisional numbers live in config and are read at runtime", () => {
  assert.equal(INDIVIDUAL_PLAN_CONFIG.flagName, INDIVIDUAL_PLAN_FLAG);
  assert.equal(INDIVIDUAL_PLAN_CONFIG.flagName, "INDIVIDUAL_PLAN_ENABLED");
  assert.equal(INDIVIDUAL_PLAN_CONFIG.monthlyGrantUnits, 200);
  assert.deepEqual(INDIVIDUAL_PLAN_CONFIG.burns, { loop_step: 1, loop_research: 5, plan_rebuild: 10 });
  assert.equal(INDIVIDUAL_PLAN_CONFIG.caps.activeOutcomes, 3);
  assert.equal(INDIVIDUAL_PLAN_CONFIG.caps.researchTasksPerMonth, 40);
  assert.equal(INDIVIDUAL_PLAN_CONFIG.caps.uploadFiles, 10);
  assert.equal(INDIVIDUAL_PLAN_CONFIG.caps.uploadMbEach, 10);
  assert.equal(INDIVIDUAL_PLAN_CONFIG.byokSkipsPerUseBurns, true);
  assert.equal(INDIVIDUAL_PLAN_CONFIG.addedDollars, 0);
  const config = readIndividualPlan(off);
  assert.equal(config.enabled, false);
  assert.equal(config.monthlyGrantUnits, 200);
  assert.equal(burnUnits("loop_step", off), 1);
  assert.equal(burnUnits("loop_research", off), 5);
  assert.equal(burnUnits("plan_rebuild", on), 10);
  assert.equal(monthlyGrant(config).units, 200);
  assert.equal(monthlyGrant(config).addedDollars, 0);
  const overridden = readIndividualPlan({ ...off, INDIVIDUAL_MONTHLY_GRANT: "40" });
  assert.equal(overridden.monthlyGrantUnits, 40);
  assert.equal(overridden.addedDollars, 0);
  const ledger = read("src/lib/individual/ledger.ts");
  const plan = read("src/lib/individual/plan.ts");
  const step = read("src/lib/gap-loop/step.ts");
  assert.equal(ledger.includes("monthlyGrantUnits"), false);
  assert.equal(plan.includes("200"), false);
  assert.equal(step.includes("loop_step"), false);
  assert.equal(burnEventForState("researching"), "loop_research");
  assert.equal(burnEventForState("rescore"), "plan_rebuild");
  assert.equal(burnEventForState("analyze"), "loop_step");
});

test("usage events accept the loop burns", () => {
  assert.equal(asUsageEventName("loop_step"), "loop_step");
  assert.equal(asUsageEventName("loop_research"), "loop_research");
  assert.equal(asUsageEventName("plan_rebuild"), "plan_rebuild");
  assert.equal(asUsageEventName("brain_write"), "brain_write");
  assert.equal(asUsageEventName("priced"), "");
});

test("flag off hides the plan name and any price", () => {
  const bodies = flagOffBodies(off);
  assert.equal(individualIsPublic(), false);
  assert.equal(individualOffer(), null);
  assert.equal(individualOffer(off), null);
  assert.equal(bodies.billing.individual, null);
  assert.equal(leaksHiddenPlan(bodies.onboarding, bodies.surface), false);
  assert.equal(leaksHiddenPlan(bodies.billing, bodies.surface), false);
  assert.equal(leaksHiddenPlan(bodies.plan, bodies.surface), false);
  assert.equal(leaksHiddenPlan(pricingVisibleText(), bodies.surface), false);
  assert.deepEqual(bodies.nav, ["Learn", "Library", "You"]);
  assert.equal(bodies.onboarding.rooms.includes("individual"), false);
  assert.deepEqual(bodies.onboarding.roomLabels, {});
  assert.equal(bodies.plan.title, "Not available");
  assert.equal(bodies.plan.cta, "");
  const { surface, ...publicBodies } = bodies;
  const published = JSON.stringify(publicBodies);
  assert.equal(published.includes(surface.displayName), false);
  assert.equal(published.includes("$10"), false);
  assert.equal(published.includes(INDIVIDUAL_PLAN_CONFIG.branchLabel), false);
  const pricing = read("src/app/pricing/page.tsx");
  assert.equal(pricing.includes(individualPlanName()), false);
  assert.equal(pricing.includes("$10"), false);
  assert.equal(pricing.includes(INDIVIDUAL_PLAN_CONFIG.branchLabel), false);
  assert.deepEqual(Object.keys(offerDisplayNames), ["diy", "coaching", "assess", "model", "build", "consulting"]);
});

test("flag on names the plan from M8 config and still has no public price", () => {
  assert.equal(individualPlanName(), "Individual");
  assert.equal(individualOffer(on), "Individual");
  assert.equal(individualIsPublic(), false);
  const billing = billingPublicPayload(on);
  assert.equal(billing.individual.name, "Individual");
  assert.equal(JSON.stringify(billing).includes("$10"), false);
  assert.equal(billing.checkoutGoLive, false);
  const plan = planPublicPayload({
    env: on,
    requirements: [
      { id: "b", label: "Second", kind: "skill", sortOrder: 1 },
      { id: "a", label: "First", kind: "knowledge", sortOrder: 0 },
    ],
  });
  assert.equal(plan.title, "Individual");
  assert.deepEqual(
    plan.items.map((item) => item.label),
    ["First", "Second"],
  );
  assert.equal(plan.widthPx, 375);
  assert.equal(plan.ariaLive, "Plan ready.");
  assert.equal(plan.cta, "Continue");
  assert.equal(JSON.stringify(plan).includes("$10"), false);
});

test("plan versions show what changed after rescore", () => {
  const plan = openPlan("plan", "outcome", [
    { id: "know", label: "Name the parts", kind: "knowledge", sortOrder: 0 },
    { id: "skill", label: "Explain the idea", kind: "skill", sortOrder: 1 },
  ]);
  assert.equal(plan.version, 1);
  assert.deepEqual(
    plan.items.map((item) => [item.position, item.kind, item.label]),
    [
      [0, "knowledge", "Name the parts"],
      [1, "skill", "Explain the idea"],
    ],
  );
  const next = reshapePlan(plan, [
    { id: "skill", label: "Explain the idea", kind: "skill", sortOrder: 0 },
    { id: "demo", label: "Show the work", kind: "demonstration", sortOrder: 1 },
  ]);
  assert.equal(next.plan.version, 2);
  assert.deepEqual(diffItems(plan.items, next.plan.items).map((change) => change.type).sort(), ["added", "moved", "removed"]);
  assert.equal(next.changes.some((change) => change.label === "Show the work"), true);
});

test("a simulated burn reaches zero and the next step is capped", () => {
  const config = readIndividualPlan(off);
  let balance = 1;
  const first = applyBurn({ balance, mode: "platform", event: "loop_step", config });
  assert.equal(first.capped, false);
  assert.equal(first.ledgerUnits, 1);
  assert.equal(first.usageUnits, 1);
  assert.equal(first.balance, 0);
  assert.equal(first.addedDollars, 0);
  balance = first.balance;
  const next = applyBurn({ balance, mode: "platform", event: "loop_step", config });
  assert.equal(next.capped, true);
  assert.equal(next.ledgerUnits, 0);
  assert.equal(next.usageUnits, 0);
  assert.equal(next.balance, 0);
  assert.equal(next.timeline.toState, "capped");
  assert.equal(next.timeline.kind, "cap");
  assert.equal(next.summary.includes("$"), false);
  assert.equal(next.summary.includes(individualPlanName()), false);
});

test("BYOK skips per-use burns, writes the usage event, and adds no dollars", () => {
  const config = readIndividualPlan(on);
  const burned = applyBurn({ balance: 50, mode: "byok", event: "loop_research", config });
  assert.equal(burned.ledgerUnits, 0);
  assert.equal(burned.balance, 50);
  assert.equal(burned.usageEvent, "loop_research");
  assert.equal(burned.usageUnits, 5);
  assert.equal(burned.capped, false);
  assert.equal(burned.addedDollars, 0);
  assert.equal(burned.baseApplies, true);
  const rebuild = applyBurn({ balance: 9, mode: "platform", event: "plan_rebuild", config });
  assert.equal(rebuild.capped, true);
  assert.equal(rebuild.addedDollars, 0);
});

test("caps and adult self-rating follow the seal", () => {
  const config = readIndividualPlan(off);
  assert.equal(withinCount(2, config.caps.activeOutcomes), true);
  assert.equal(withinCount(3, config.caps.activeOutcomes), false);
  assert.equal(withinCount(39, config.caps.researchTasksPerMonth), true);
  assert.equal(withinCount(40, config.caps.researchTasksPerMonth), false);
  assert.equal(uploadAllowed({ files: 10, bytes: 10 * 1024 * 1024, config }).ok, true);
  assert.equal(uploadAllowed({ files: 11, bytes: 1, config }).error, "upload_files");
  assert.equal(uploadAllowed({ files: 1, bytes: 10 * 1024 * 1024 + 1, config }).error, "upload_bytes");
  assert.equal(adultMaySelfRate({ actorKind: "adult", ownerKind: "person", samePerson: true }), true);
  assert.equal(adultMaySelfRate({ actorKind: "child", ownerKind: "person", samePerson: true }), false);
  assert.equal(adultMaySelfRate({ actorKind: "adult", ownerKind: "child", samePerson: true }), false);
  const refused = copyWithConsent({ consent: false, items: [{ id: "a" }] });
  assert.equal(refused.ok, false);
  const copied = copyWithConsent({ consent: true, items: [{ id: "a" }] });
  assert.equal(copied.ok, true);
  assert.equal(copied.mode, "copy");
  assert.notEqual(copied.items[0], { id: "a" });
  assert.deepEqual(copied.items, [{ id: "a" }]);
});

test("signup to the first CTA stays inside 10 minutes at 375px", () => {
  const walk = scriptedIndividualToFirstCta();
  assert.equal(walk.widthPx, 375);
  assert.ok(walk.elapsedMs < walk.budgetMs);
  assert.ok(walk.elapsedMs < 10 * 60 * 1000);
  assert.equal(walk.flow.room, "individual");
  assert.equal(walk.flow.profileDone, true);
  assert.equal(walk.state, "waiting_on_user");
  assert.equal(walk.timeline.at(-1).summary, "One request is ready.");
  assert.deepEqual(
    walk.plan.items.map((item) => item.label),
    ["Name the parts", "Explain the idea", "Show the work"],
  );
  assert.equal(walk.reshaped.plan.version, 2);
  assert.ok(walk.reshaped.changes.length > 0);
});

test("homeschool stays, the rail stays, and go-live flags stay off", () => {
  assert.equal(nextOrgKind("homeschool", "individual"), "homeschool");
  assert.equal(nextOrgKind("family", "individual"), "family");
  assert.equal(nextOrgKind("homeschool", "team"), "homeschool");
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.equal(MEMBER_RAIL_DEFAULT, "issue-368");
  assert.equal(M9_METRICS.railPx, 240);
  assert.deepEqual(memberDoors(MEMBER_RAIL_DEFAULT).map((door) => door.label), ["Learn", "Library", "You"]);
  assert.match(read("../README.md"), /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(read("src/lib/billing/checkout-destination.ts"), /export const CHECKOUT_GO_LIVE = false/);
  assert.match(read("marketing-site/js/checkout-switch.mjs"), /export const COACHING_GO_LIVE = false/);
  const compose = read("deploy/docker-compose.yml");
  assert.match(compose, /INDIVIDUAL_PLAN_ENABLED: "\$\{INDIVIDUAL_PLAN_ENABLED:-false\}"/);
  assert.match(read("deploy/deploy.sh"), /INDIVIDUAL_PLAN_ENABLED=false/);
  assert.doesNotMatch(read("src/lib/shell/m9-shell.ts"), /Individual/);
});

test("0032 is idempotent and does not edit 0031 or drop living data", async () => {
  const sqlText = read("db/0032_gl3_individual_plan.sql");
  assert.match(sqlText, /CREATE TABLE IF NOT EXISTS learning_plans/);
  assert.match(sqlText, /CREATE TABLE IF NOT EXISTS plan_items/);
  assert.match(sqlText, /CHECK \(kind = 'individual'\)/);
  assert.match(sqlText, /CHECK \(status IN \('draft', 'active', 'archived'\)\)/);
  assert.doesNotMatch(sqlText, /DROP |DELETE FROM|TRUNCATE/i);
  assert.doesNotMatch(sqlText, /ALTER TABLE organizations|homeschool/i);
  assert.equal(read("db/0031_pm4_profile.sql").includes("learning_plans"), false);
  const postgres = (await import("postgres")).default;
  const url = process.env.GL3_TEST_DATABASE_URL || "postgres://gl3:gl3@127.0.0.1:5432/gl3_individual";
  const host = new URL(url).hostname;
  assert.ok(host === "127.0.0.1" || host === "localhost");
  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS organizations (id uuid PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS growth_units (id uuid PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS memberships (id uuid PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS outcomes (id uuid PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS outcome_requirements (id uuid PRIMARY KEY);
    `);
    await sql.unsafe(sqlText);
    await sql.unsafe(sqlText);
    const org = "11111111-1111-4111-8111-111111111111";
    const unit = "22222222-2222-4222-8222-222222222222";
    const member = "33333333-3333-4333-8333-333333333333";
    const outcome = "44444444-4444-4444-8444-444444444444";
    const know = "55555555-5555-4555-8555-555555555555";
    const skill = "66666666-6666-4666-8666-666666666666";
    await sql`INSERT INTO organizations (id) VALUES (${org}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO growth_units (id) VALUES (${unit}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO memberships (id) VALUES (${member}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO outcomes (id) VALUES (${outcome}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO outcome_requirements (id) VALUES (${know}), (${skill}) ON CONFLICT DO NOTHING`;
    await sql`DELETE FROM plan_items`;
    await sql`DELETE FROM learning_plans`;
    const [plan] = await sql`
      INSERT INTO learning_plans (org_id, growth_unit_id, owner_membership_id, outcome_id, status)
      VALUES (${org}, ${unit}, ${member}, ${outcome}, 'active')
      RETURNING id, version, kind
    `;
    assert.equal(plan.kind, "individual");
    assert.equal(Number(plan.version), 1);
    await sql`
      INSERT INTO plan_items (learning_plan_id, position, label, kind, outcome_requirement_id, version)
      VALUES
        (${plan.id}, 0, 'Name the parts', 'knowledge', ${know}, 1),
        (${plan.id}, 1, 'Explain the idea', 'skill', ${skill}, 1)
    `;
    const items = await sql`
      SELECT label FROM plan_items WHERE learning_plan_id = ${plan.id} AND version = 1 ORDER BY position
    `;
    assert.deepEqual(items.map((item) => item.label), ["Name the parts", "Explain the idea"]);
  } finally {
    await sql.end({ timeout: 1 });
  }
});
