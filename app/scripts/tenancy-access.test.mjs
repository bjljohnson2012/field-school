import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");
register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let target = src + "/" + specifier.slice(2);
    if (!/\\.(ts|tsx|js|mjs|cjs|json)$/.test(target)) target += ".ts";
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}
`),
);

const { canRead, canWrite, loginAllowed, scopeSurface } = await import(
  pathToFileURL(join(src, "lib/tenancy/access.ts")).href,
);
const { pickActiveSlug } = await import(
  pathToFileURL(join(src, "lib/campus-runtime/rules.ts")).href,
);
const { DEAN_EMAIL } = await import(pathToFileURL(join(src, "lib/campus.ts")).href);

function adult(over) {
  return {
    memberId: "member-a",
    orgId: "org-a",
    orgSlug: "family-a",
    orgKind: "family",
    stance: "guardian",
    memberKind: "adult",
    ...over,
  };
}

test("two families cannot read each other on People, Library, or Insights", () => {
  const familyA = adult({ memberId: "ada", orgId: "org-a", orgSlug: "family-a" });
  const familyB = adult({ memberId: "bea", orgId: "org-b", orgSlug: "family-b" });
  const rows = [
    { orgId: "org-a", name: "Ada home" },
    { orgId: "org-b", name: "Bea home" },
  ];
  for (const surface of ["people", "library", "insights"]) {
    assert.deepEqual(
      scopeSurface(familyA, surface, rows).map((row) => row.name),
      ["Ada home"],
      surface,
    );
    assert.deepEqual(
      scopeSurface(familyB, surface, rows).map((row) => row.name),
      ["Bea home"],
      surface,
    );
  }
  assert.equal(canRead(familyA, { orgId: "org-b" }), false);
  assert.equal(canRead(familyB, { orgId: "org-a" }), false);
});

test("two teams cannot read each other on People, Library, or Insights", () => {
  const teamA = adult({
    memberId: "ann",
    orgId: "team-a",
    orgSlug: "team-a",
    orgKind: "team",
    stance: "trainer",
  });
  const teamB = adult({
    memberId: "bob",
    orgId: "team-b",
    orgSlug: "team-b",
    orgKind: "team",
    stance: "trainer",
  });
  const rows = [
    { orgId: "team-a", name: "Ann roster" },
    { orgId: "team-b", name: "Bob roster" },
  ];
  for (const surface of ["people", "library", "insights"]) {
    assert.deepEqual(
      scopeSurface(teamA, surface, rows).map((row) => row.name),
      ["Ann roster"],
      surface,
    );
    assert.deepEqual(
      scopeSurface(teamB, surface, rows).map((row) => row.name),
      ["Bob roster"],
      surface,
    );
  }
});

test("a person in development has no login and only an accountable adult in the same org can edit them", () => {
  assert.equal(loginAllowed({ kind: "child" }), false);
  assert.equal(loginAllowed({ kind: "adult" }), true);
  assert.equal(loginAllowed({ kind: null }), false);

  const child = { orgId: "org-a", memberKind: "child", login: "none", memberId: "kid" };
  const guardian = adult({ stance: "guardian" });
  const learner = adult({ stance: "learner", memberId: "learner" });
  const otherOrg = adult({ orgId: "org-b", orgSlug: "family-b", stance: "guardian" });
  const childActor = adult({ memberKind: "child", stance: "guardian" });

  assert.equal(canRead(childActor, { orgId: "org-a" }), false);
  assert.equal(canWrite(guardian, child), true);
  assert.equal(canWrite(adult({ stance: "owner" }), child), true);
  assert.equal(canWrite(adult({ stance: "teacher" }), child), true);
  assert.equal(canWrite(learner, child), false);
  assert.equal(canWrite(otherOrg, child), false);
  assert.equal(canWrite(childActor, child), false);
  assert.equal(canWrite(adult({ orgKind: "team", orgSlug: "team-a", stance: "trainer" }), child), false);
});

test("a null kind cannot log in", () => {
  assert.equal(loginAllowed({ kind: null }), false);
  assert.equal(loginAllowed({ kind: null, email: "person@example.com" }), false);
  assert.equal(loginAllowed({ kind: "" }), false);
});

test("a missing members row cannot log in", () => {
  assert.equal(loginAllowed(null), false);
  assert.equal(loginAllowed(undefined), false);
  assert.equal(loginAllowed(null, "person@example.com"), false);
});

test("allowlisted staff can log in when kind is null or the members row is missing", () => {
  assert.equal(loginAllowed({ kind: null, email: DEAN_EMAIL }), true);
  assert.equal(loginAllowed(null, DEAN_EMAIL), true);
  assert.equal(loginAllowed({ kind: "child", email: DEAN_EMAIL }), false);
});

test("staff with no personal org land on the operator org", () => {
  assert.equal(
    pickActiveSlug("", ["field-school", "household", "sales"], "adult", true),
    "field-school",
  );
  assert.equal(
    pickActiveSlug("", ["field-school", "family-ada", "household", "sales"], "adult", true),
    "family-ada",
  );
  assert.equal(
    pickActiveSlug("household", ["field-school", "household", "sales"], "adult", true),
    "household",
  );
  assert.equal(
    pickActiveSlug("", ["field-school", "household", "sales"], "adult", false),
    "household",
  );
});

test("household and sales templates are readable by a member and not writable", () => {
  const home = adult({ orgId: "household-id", orgSlug: "household", orgKind: "family", stance: "guardian" });
  const sales = adult({ orgId: "sales-id", orgSlug: "sales", orgKind: "company", stance: "trainer" });
  assert.equal(canRead(home, { orgId: "household-id" }), true);
  assert.equal(canWrite(home, { orgId: "household-id", memberKind: "adult", memberId: "other" }), false);
  assert.equal(canWrite(home, { orgId: "household-id", memberKind: "child", login: "none" }), false);
  assert.equal(canRead(sales, { orgId: "sales-id" }), true);
  assert.equal(canWrite(sales, { orgId: "sales-id", memberKind: "adult", memberId: "other" }), false);
  assert.equal(canRead(home, { orgId: "sales-id" }), false);
});
