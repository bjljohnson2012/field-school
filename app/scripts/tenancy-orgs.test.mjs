import assert from "node:assert/strict";
import test from "node:test";
import { inviteTarget, planRoomOrg, switcherOrgs } from "../src/lib/tenancy/orgs.ts";

test("signup and start-a-family land in a new family org the member owns", () => {
  const signup = planRoomOrg({
    memberId: "member-ada",
    memberName: "Ada",
    room: "family",
  });
  const again = planRoomOrg({
    memberId: "member-ada",
    memberName: "Ada",
    room: "family",
  });
  assert.deepEqual(again, signup);
  assert.equal(signup.kind, "family");
  assert.equal(signup.stance, "owner");
  assert.equal(signup.createdBy, "member-ada");
  assert.equal(signup.homeschoolMode, false);
  assert.equal(signup.slug.startsWith("family-"), true);
  assert.notEqual(signup.slug, "field-school");
  assert.notEqual(signup.slug, "household");
  assert.notEqual(signup.slug, "sales");
});

test("start a team lands in a team org and does not reuse the family slug", () => {
  const family = planRoomOrg({ memberId: "member-ada", memberName: "Ada", room: "family" });
  const team = planRoomOrg({
    memberId: "member-ada",
    memberName: "Ada",
    room: "team",
    name: "Ada coaching",
  });
  assert.equal(team.kind, "team");
  assert.equal(team.name, "Ada coaching");
  assert.equal(team.stance, "owner");
  assert.notEqual(team.slug, family.slug);
  assert.equal(
    planRoomOrg({ memberId: "member-ada", memberName: "Ada", room: "team", name: "Ada coaching" }).slug,
    team.slug,
  );
});

test("an invite joins only the inviting org", () => {
  const target = inviteTarget(
    { orgId: "org-family", orgSlug: "family-ada" },
    "household",
  );
  assert.deepEqual(target, { orgId: "org-family", orgSlug: "family-ada" });
  assert.notEqual(target.orgSlug, "household");
  assert.notEqual(target.orgSlug, "sales");
  assert.notEqual(target.orgSlug, "field-school");
});

test("the switcher lists only that member's orgs and marks the templates read only", () => {
  const rows = switcherOrgs("ada", [
    { memberId: "ada", org: "family-ada", name: "Ada family" },
    { memberId: "bea", org: "family-bea", name: "Bea family" },
    { memberId: "ada", org: "household", name: "Household" },
    { memberId: "ada", org: "family-ada", name: "Ada family" },
    { memberId: "ada", org: "sales", name: "Sales team" },
  ]);
  assert.deepEqual(
    rows.map((row) => row.org),
    ["family-ada", "household", "sales"],
  );
  assert.equal(rows.find((row) => row.org === "family-ada")?.readOnly, false);
  assert.equal(rows.find((row) => row.org === "household")?.readOnly, true);
  assert.equal(rows.find((row) => row.org === "sales")?.readOnly, true);
});
