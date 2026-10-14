import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import { KID_GATES } from "../src/lib/profile/model.ts";
import { AIM_STORE, firstGoalInput } from "../src/lib/onboarding/aim.ts";
import {
  AccountFlowStore,
  CAMPUS_READY_STEP,
  FIXTURE_WIDTH_PX,
  INDIVIDUAL_PLAN_ENABLED,
  KID_INTAKE,
  LEARN_HARD_GATED,
  ONBOARDING_COPY,
  ONBOARDING_EVENT,
  SIGNUP_LESSON_BUDGET_MS,
  STEP_IDS,
  advance,
  attachOrg,
  individualBranch,
  inviteEntryStep,
  inviteLanding,
  learnBlocked,
  nextOrgKind,
  openInvite,
  openSignup,
  profileNudge,
  scriptedSignupToLesson,
  shouldResume,
  signupLanding,
  visibleStepIds,
} from "../src/lib/onboarding/graph.ts";
import { m12EngineSteps } from "../src/lib/onboarding/steps.ts";
import { MEMBER_RAIL_DEFAULT, M9_METRICS, memberDoors } from "../src/lib/shell/m9-shell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

const onboardingFiles = [
  ...walk(join(root, "src/lib/onboarding")),
  ...walk(join(root, "src/app/onboarding")),
  ...walk(join(root, "src/components/onboarding")),
  join(root, "src/app/api/onboarding/route.ts"),
  join(root, "db/0027_m12_onboarding.sql"),
].map((abs) => readFileSync(abs, "utf8"));

test("sealed step ids, flag defaults, and the member rail stay Learn Library You", () => {
  assert.deepEqual([...STEP_IDS], [
    "brain-name",
    "room",
    "org-name",
    "homeschool-mode",
    "people",
    "adult-gates",
    "kid-intake",
    "first-goal",
    "home-lesson",
  ]);
  assert.equal(INDIVIDUAL_PLAN_ENABLED, false);
  assert.equal(LEARN_HARD_GATED, false);
  assert.equal(learnBlocked(), false);
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.deepEqual(individualBranch(), ["family", "team"]);
  assert.equal(individualBranch().includes("individual"), false);
  assert.equal(KID_INTAKE.name, "Kid profile");
  assert.equal(KID_INTAKE.href, "/onboarding/kid-profile");
  assert.equal(KID_INTAKE.gateId, "G-intake");
  assert.equal(KID_GATES[0].href, null);
  assert.equal(CAMPUS_READY_STEP, "home-lesson");
  assert.equal(MEMBER_RAIL_DEFAULT, "issue-368");
  assert.equal(M9_METRICS.railPx, 240);
  assert.deepEqual(
    memberDoors(MEMBER_RAIL_DEFAULT).map((door) => door.label),
    ["Learn", "Library", "You"],
  );
  assert.deepEqual(
    m12EngineSteps().map((step) => step.id),
    [...STEP_IDS],
  );
  const page = read("src/app/onboarding/page.tsx");
  assert.match(page, /data-shell="m9"/);
  assert.match(page, /data-rail="learn-library-you"/);
  assert.match(page, /data-rail-px="240"/);
  assert.match(page, /data-viewport-fixture="390"/);
  assert.match(read("src/app/onboarding/flow.tsx"), /@onboardjs\/react/);
  assert.match(read("src/lib/onboarding/steps.ts"), /@onboardjs\/core/);
  assert.match(read("src/app/onboarding/flow.tsx"), /analytics=\{\{ enabled: false \}\}/);
});

test("campus_ready flips at home-lesson and profile_done flips when the gates are done", () => {
  let flow = openSignup("leader");
  assert.equal(flow.campusReady, false);
  assert.equal(flow.profileDone, false);
  const run = (action) => {
    const result = advance(flow, action);
    assert.equal(result.ok, true, result.error);
    flow = result.flow;
  };
  run({ type: "brain-name", brainName: "North brain" });
  assert.equal(flow.stepId, "room");
  assert.equal(flow.campusReady, false);
  const org = attachOrg(flow, "org-1");
  assert.equal(org.ok, true);
  flow = org.flow;
  assert.deepEqual(flow.createdOrgIds, ["org-1"]);
  assert.equal(attachOrg(flow, "org-2").error, "second_org");
  run({ type: "room", room: "family" });
  run({ type: "org-name", orgName: "North family" });
  run({ type: "homeschool-mode", homeschoolMode: true });
  run({ type: "people", people: [{ name: "Ada", role: "child", login: "none" }] });
  run({ type: "adult-gates", gates: { "G-personality": true, "G-skills": true, "G-other": true } });
  assert.equal(flow.profileDone, false);
  assert.equal(flow.campusReady, false);
  assert.equal(flow.stepId, "kid-intake");
  assert.equal(shouldResume("/learn", flow), false);
  assert.equal(shouldResume("/c/grok-bot", flow), false);
  assert.equal(shouldResume("/dashboard", flow), true);
  run({ type: "kid-intake", displayName: "Ada" });
  assert.equal(flow.profileDone, true);
  assert.equal(flow.campusReady, false);
  assert.equal(learnBlocked(), false);
  run({ type: "first-goal", aim: "Read a page and tell it back" });
  assert.equal(flow.campusReady, false);
  assert.equal(flow.outcomeId, null);
  run({ type: "home-lesson" });
  assert.equal(flow.campusReady, true);
  assert.equal(flow.profileDone, true);
  assert.equal(flow.stepId, "home-lesson");
  assert.equal(shouldResume("/dashboard", flow), false);
  assert.equal(profileNudge(flow), null);
});

test("a team can finish gates before home and Learn stays open", () => {
  let flow = openSignup("lead");
  const run = (action) => {
    const result = advance(flow, action);
    assert.equal(result.ok, true, result.error);
    flow = result.flow;
  };
  run({ type: "brain-name", brainName: "Desk brain" });
  run({ type: "room", room: "team" });
  assert.equal(visibleStepIds(flow).includes("homeschool-mode"), false);
  assert.equal(visibleStepIds(flow).includes("kid-intake"), false);
  run({ type: "org-name", orgName: "Desk team" });
  assert.equal(flow.stepId, "people");
  run({ type: "people", people: [{ name: "Jules", role: "member", login: "member" }] });
  run({ type: "adult-gates", gates: { "G-personality": true, "G-skills": true, "G-other": true } });
  assert.equal(flow.profileDone, true);
  assert.equal(flow.campusReady, false);
  assert.equal(flow.stepId, "first-goal");
  assert.equal(profileNudge(flow), null);
  run({ type: "first-goal", aim: "Hold the next discovery call" });
  run({ type: "home-lesson" });
  assert.deepEqual(profileNudge({ ...flow, profileDone: false }), {
    label: "Finish setting up your profile",
    href: "/onboarding?step=adult-gates",
  });
});

test("invitees enter at brain-name or people and do not create a second org", () => {
  assert.equal(inviteEntryStep(false), "brain-name");
  assert.equal(inviteEntryStep(true), "people");
  const named = openInvite({ accountId: "member", invitingOrgId: "org-invite", brainNamed: true });
  assert.equal(named.stepId, "people");
  assert.equal(named.orgId, "org-invite");
  assert.deepEqual(named.createdOrgIds, []);
  assert.equal(attachOrg(named, "org-other").error, "invite_second_org");
  assert.equal(advance(named, { type: "room", room: "family" }).error, "invite_skips_room");
  assert.equal(visibleStepIds(named).includes("room"), false);
  assert.equal(visibleStepIds(named).includes("org-name"), false);
  const fresh = openInvite({ accountId: "member", invitingOrgId: "org-invite", brainNamed: false });
  assert.equal(fresh.stepId, "brain-name");
  const namedBrain = advance(fresh, { type: "brain-name", brainName: "Shared brain" });
  assert.equal(namedBrain.ok, true);
  assert.equal(namedBrain.flow.stepId, "people");
  assert.deepEqual(namedBrain.flow.createdOrgIds, []);
  const skipped = advance(namedBrain.flow, { type: "people", skip: true });
  assert.equal(skipped.ok, true);
  assert.equal(skipped.flow.stepId, "adult-gates");
  assert.equal(inviteLanding(), "/onboarding?entry=invite");
  assert.match(read("src/app/invite/[token]/page.tsx"), /inviteLanding\(\)/);
  assert.doesNotMatch(read("src/app/invite/[token]/page.tsx"), /router\.push\(`\/o\/\$\{data\.org\}`\)/);
  assert.equal(signupLanding("/dashboard"), "/onboarding");
  assert.match(read("src/app/signup/signup-form.tsx"), /signupLanding\(next\)/);
});

test("resume after a simulated sign-out keeps the same step id", () => {
  const store = new AccountFlowStore();
  let flow = openSignup("ada");
  const named = advance(flow, { type: "brain-name", brainName: "Ada brain" });
  assert.equal(named.ok, true);
  flow = named.flow;
  store.save(flow);
  const stepId = flow.stepId;
  store.signOut();
  assert.equal(store.current(), null);
  const again = store.signIn("ada");
  assert.equal(again.stepId, stepId);
  assert.equal(again.brainName, "Ada brain");
  assert.equal(again.campusReady, false);
});

test("the individual branch and kid photo step stay out of the public graph", () => {
  let flow = openSignup("sam");
  flow = advance(flow, { type: "brain-name", brainName: "Sam brain" }).flow;
  assert.equal(advance(flow, { type: "room", room: "individual" }).error, "individual_off");
  const copy = Object.values(ONBOARDING_COPY).join("\n");
  assert.doesNotMatch(copy, /Individual|\$\d|Gym|Foundry|Retainer|Learn with Ben/);
  assert.equal(STEP_IDS.some((id) => /photo|individual/i.test(id)), false);
  const family = openSignup("parent");
  let cursor = family;
  for (const action of [
    { type: "brain-name", brainName: "Home brain" },
    { type: "room", room: "family" },
    { type: "org-name", orgName: "Home" },
    { type: "homeschool-mode", homeschoolMode: false },
    { type: "people", people: [{ name: "Ada", role: "child", login: "none" }] },
    { type: "adult-gates", gates: { "G-personality": true, "G-skills": true, "G-other": true } },
  ]) {
    const next = advance(cursor, action);
    assert.equal(next.ok, true, next.error);
    cursor = next.flow;
  }
  assert.equal(advance(cursor, { type: "kid-intake", displayName: "Ada", photoUrl: "https://cdn.example/a.jpg" }).error, "kid_no_photo");
  assert.equal(advance(cursor, { type: "kid-intake", displayName: "Ada", publicUrl: "https://fieldschool.ai/u/ada" }).error, "kid_no_public_url");
  const people = openSignup("parent");
  let atPeople = people;
  for (const action of [
    { type: "brain-name", brainName: "Home brain" },
    { type: "room", room: "family" },
    { type: "org-name", orgName: "Home" },
    { type: "homeschool-mode", homeschoolMode: false },
  ]) {
    atPeople = advance(atPeople, action).flow;
  }
  assert.equal(advance(atPeople, { type: "people", people: [{ name: "Ada", role: "child", login: "none" }], photoUrl: "https://cdn.example/a.jpg" }).error, "kid_no_photo");
  const kidForm = read("src/app/onboarding/kid-profile/form.tsx");
  assert.match(kidForm, /data-form-name=\{KID_INTAKE\.name\}/);
  assert.match(kidForm, /data-no-photo="true"/);
  assert.doesNotMatch(kidForm, /type="file"|photoUrl|publicUrl/);
});

test("analytics events are learning_events rows and the first goal reuses outcomes", () => {
  let flow = openSignup("analyst");
  const stepped = advance(flow, { type: "brain-name", brainName: "Signal brain" });
  assert.equal(stepped.ok, true);
  flow = stepped.flow;
  assert.equal(flow.events.length, 1);
  assert.equal(flow.events[0].destination, "learning_events");
  assert.equal(flow.events[0].kind, ONBOARDING_EVENT.kind);
  assert.equal(flow.events[0].objectType, ONBOARDING_EVENT.objectType);
  assert.equal(flow.events[0].objectId, "brain-name");
  assert.equal(AIM_STORE, "outcomes");
  const aim = firstGoalInput("Hold a calmer evening read");
  assert.equal(aim.store, "outcomes");
  assert.equal(aim.ownerKind, "person");
  assert.equal(aim.statement, "Hold a calmer evening read");
  const store = read("src/lib/onboarding/store.ts");
  assert.match(store, /INSERT INTO learning_events/);
  assert.match(store, /createOutcome/);
  assert.doesNotMatch(store, /CREATE TABLE/);
  const sql = read("db/0027_m12_onboarding.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS onboarding_flows/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS/);
  assert.doesNotMatch(sql, /0026_/);
  assert.doesNotMatch(sql, /DROP |DELETE FROM/);
  assert.doesNotMatch(sql, /CREATE TABLE[^;]*\baims\b/i);
  assert.equal(nextOrgKind("homeschool", "team"), "homeschool");
  assert.match(read("src/lib/tenancy/kind.ts"), /homeschool/);
});

test("signup to the first lesson on a 390px fixture stays inside 10 minutes", () => {
  const started = Date.now();
  const walk = scriptedSignupToLesson();
  const wallMs = Date.now() - started;
  assert.equal(walk.widthPx, FIXTURE_WIDTH_PX);
  assert.equal(walk.widthPx, 390);
  assert.ok(walk.elapsedMs < walk.budgetMs);
  assert.equal(walk.budgetMs, SIGNUP_LESSON_BUDGET_MS);
  assert.ok(walk.elapsedMs < 10 * 60 * 1000);
  assert.ok(wallMs < 2_000);
  assert.equal(walk.flow.campusReady, true);
  assert.equal(walk.flow.profileDone, true);
  assert.match(read("src/app/dashboard/page.tsx"), /data-starter-lesson=\{STARTER_LESSON\.courseSlug\}/);
});

test("onboarding diff stays off vendors, live stripe, drizzle-kit, and the New menu", () => {
  const joined = onboardingFiles.join("\n");
  assert.doesNotMatch(joined, /—/);
  assert.doesNotMatch(joined, /posthog|mixpanel|segment\.com|amplitude|plausible/i);
  assert.doesNotMatch(joined, /drizzle-kit|sk_live|rk_live/);
  assert.doesNotMatch(joined, /Gym|Foundry|Retainer|Learn with Ben/);
  assert.doesNotMatch(joined, /NEW_ITEMS|newMenu\(/);
  assert.doesNotMatch(read("src/lib/shell/m9-shell.ts"), /onboarding/);
  assert.match(read("src/components/m9/shell.tsx"), /newMenu\(brain\)/);
});
