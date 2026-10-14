import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canWriteOutcome, outcomeWrite, rowsForDesk } from "../src/lib/gap-loop/rules.ts";

const guardian = {
  kind: "adult",
  stance: "guardian",
  orgSlug: "household",
  orgId: "home-org",
  membershipId: "mem-parent",
  memberId: "member-1",
  mode: "family",
  features: { mode: "family" },
};

test("a family guardian can write a family outcome", () => {
  assert.equal(canWriteOutcome(guardian, "family", false), true);
  assert.equal(outcomeWrite({ ...guardian, stance: "learner" }, "family", false).ok, false);
});

test("a team member cannot write a team outcome unless they are a leader", () => {
  const member = { ...guardian, orgSlug: "sales", orgId: "sales-org", stance: "learner", mode: "none", features: {} };
  assert.equal(outcomeWrite(member, "team", false).ok, false);
  assert.equal(outcomeWrite(member, "team", false).error, "team_leader_only");
  const leader = { ...member, stance: "leader" };
  assert.equal(canWriteOutcome(leader, "team", false), true);
  assert.equal(outcomeWrite(guardian, "team", false).error, "household_cannot_create_team_goal");
});

test("a sales desk never keeps household rows from one result set", () => {
  const sales = { ...guardian, orgSlug: "sales", orgId: "sales-org", stance: "leader", mode: "none", features: {} };
  const rows = [
    { orgId: "sales-org", orgSlug: "sales", ownerKind: "team", ownerMembershipId: "someone-else", childMembershipId: null },
    { orgId: "home-org", orgSlug: "household", ownerKind: "family", ownerMembershipId: "mem-parent", childMembershipId: null },
  ];
  const visible = rowsForDesk(sales, rows, false);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].orgSlug, "sales");
  assert.equal(visible.some((row) => row.orgSlug === "household"), false);
  const sql = readFileSync(new URL("../src/lib/gap-loop/store.ts", import.meta.url), "utf8");
  assert.match(sql, /SELECT \* FROM outcomes WHERE org_id = /);
});
