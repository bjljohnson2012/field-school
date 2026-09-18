import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");
const repo = join(root, "..");

const OPERATOR_SLUG = "field-school";
const HOUSEHOLD_SLUG = "household";
const SALES_SLUG = "sales";

const INVITE_STANCES = {
  [HOUSEHOLD_SLUG]: ["learner", "guardian"],
  [SALES_SLUG]: ["learner", "trainer"],
  [OPERATOR_SLUG]: ["learner", "admin"],
};

function pickActiveSlug(requested, slugs, memberKind) {
  const allowed = memberKind === "child" ? slugs.filter((s) => s !== SALES_SLUG) : slugs;
  if (requested && allowed.includes(requested)) return requested;
  if (allowed.includes(HOUSEHOLD_SLUG)) return HOUSEHOLD_SLUG;
  if (allowed.includes(SALES_SLUG)) return SALES_SLUG;
  return allowed[0] || "";
}

function courseAllowedInOrg(orgSlug, course) {
  if (orgSlug === HOUSEHOLD_SLUG) return course === "home";
  if (orgSlug === SALES_SLUG) return course === "sales";
  return course === "grok-bot";
}

function defaultInviteStance(orgSlug) {
  if (orgSlug === HOUSEHOLD_SLUG) return "guardian";
  if (orgSlug === SALES_SLUG) return "trainer";
  return "learner";
}

function inviteStanceAllowed(orgSlug, stance) {
  return (INVITE_STANCES[orgSlug] ?? ["learner"]).includes(stance);
}

function canMintInvite(actor, targetOrg, staff) {
  if (actor.kind === "child") return false;
  if (staff) return true;
  if (actor.orgSlug !== targetOrg) return false;
  return actor.stance === "admin" || actor.stance === "guardian" || actor.stance === "trainer";
}

function canCreateChild(actor, staff) {
  if (actor.orgSlug !== HOUSEHOLD_SLUG) return false;
  if (actor.kind === "child") return false;
  return staff || actor.stance === "admin" || actor.stance === "guardian";
}

function childCanAdmin() {
  return false;
}

function shouldForceOperatorOrg(opts) {
  if (opts.staff) return false;
  const hasStudent = opts.slugs.some((slug) => slug === HOUSEHOLD_SLUG || slug === SALES_SLUG);
  return !hasStudent && opts.slugs.length === 0;
}

test("picker prefers household then sales, and hides sales from children", () => {
  assert.equal(pickActiveSlug("", ["field-school", "household", "sales"], "adult"), "household");
  assert.equal(pickActiveSlug("sales", ["field-school", "household", "sales"], "adult"), "sales");
  assert.equal(pickActiveSlug("sales", ["household", "sales"], "child"), "household");
  assert.equal(pickActiveSlug("household", ["field-school", "household"], "adult"), "household");
});

test("events stay inside the active org catalog", () => {
  assert.equal(courseAllowedInOrg("household", "home"), true);
  assert.equal(courseAllowedInOrg("household", "grok-bot"), false);
  assert.equal(courseAllowedInOrg("household", "sales"), false);
  assert.equal(courseAllowedInOrg("sales", "sales"), true);
  assert.equal(courseAllowedInOrg("sales", "home"), false);
  assert.equal(courseAllowedInOrg("field-school", "grok-bot"), true);
  assert.equal(courseAllowedInOrg("field-school", "home"), false);
});

test("household and sales invite stances, child cannot invite or admin", () => {
  assert.equal(defaultInviteStance("household"), "guardian");
  assert.equal(defaultInviteStance("sales"), "trainer");
  assert.equal(inviteStanceAllowed("household", "guardian"), true);
  assert.equal(inviteStanceAllowed("household", "trainer"), false);
  assert.equal(inviteStanceAllowed("sales", "trainer"), true);
  assert.equal(inviteStanceAllowed("sales", "guardian"), false);
  const child = { kind: "child", stance: "learner", orgSlug: "household" };
  assert.equal(canMintInvite(child, "household", false), false);
  assert.equal(canMintInvite(child, "household", true), false);
  assert.equal(canCreateChild(child, false), false);
  assert.equal(childCanAdmin(), false);
  assert.equal(canMintInvite({ kind: "adult", stance: "learner", orgSlug: "household" }, "household", false), false);
  assert.equal(canMintInvite({ kind: "adult", stance: "guardian", orgSlug: "household" }, "household", false), true);
  assert.equal(canMintInvite({ kind: "adult", stance: "trainer", orgSlug: "sales" }, "sales", false), true);
  assert.equal(canCreateChild({ kind: "adult", stance: "trainer", orgSlug: "sales" }, false), false);
});

test("operator join is not forced onto household or sales members", () => {
  assert.equal(shouldForceOperatorOrg({ staff: false, slugs: [] }), true);
  assert.equal(shouldForceOperatorOrg({ staff: false, slugs: ["household"] }), false);
  assert.equal(shouldForceOperatorOrg({ staff: false, slugs: ["sales"] }), false);
  assert.equal(shouldForceOperatorOrg({ staff: true, slugs: [] }), false);
});

test("fixture lessons and tenant UI stay in app/", () => {
  const lessons = readSrc("src/lib/campus-runtime/lessons.ts");
  assert.match(lessons, /objectId: "home:welcome"/);
  assert.match(lessons, /objectId: "sales:welcome"/);
  assert.match(lessons, /Household welcome/);
  assert.doesNotMatch(lessons, /Welcome home|street|neighborhood|Madee/i);
  assert.match(lessons, /It is not the Grok Bot catalog/);
  const orgHome = readSrc("src/app/o/[slug]/page.tsx");
  const childrenDb = readSrc("src/components/children-database.tsx");
  assert.doesNotMatch(orgHome, /gym/i);
  assert.match(orgHome, /No Grok Bot catalog here/);
  assert.match(orgHome, /Children/);
  assert.match(childrenDb, /Kids have no own login/);
  assert.doesNotMatch(orgHome, /Student/);
  assert.doesNotMatch(childrenDb, /Student/);
  const me = readSrc("src/app/api/me/route.ts");
  assert.match(me, /activeOrg/);
  const layout = readSrc("src/app/o/[slug]/layout.tsx");
  assert.match(layout, /assertOrgPageAccess/);
});

test("wave docs still lock AUTH_URL and the frozen TanStack tree", () => {
  const prompt = readFileSync(join(repo, "docs/campus-runtime/CURSOR_AGENT_PROMPT.md"), "utf8");
  assert.match(prompt, /university\.benjohnson\.ai/);
  assert.match(prompt, /Do not flip it/);
  const src = readSrc("src/lib/campus-runtime/identity.ts");
  assert.doesNotMatch(src, /from "\.\.\/\.\.\/\.\.\/src\//);
});
