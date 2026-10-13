import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { planBackfill } from "../src/lib/tenancy/backfill.ts";
import { planTestRows } from "../src/lib/tenancy/test-rows.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const orgs = [
  { id: "org-home", slug: "household", kind: "family", name: "Household" },
  { id: "org-sales", slug: "sales", kind: "company", name: "Sales team" },
  { id: "org-import", slug: "aecoach-north", kind: "company", name: "North desk" },
];

const members = [
  { id: "adaaaaaaaaaaaa", name: "Ada", email: "ada@real.com", kind: "adult" },
  { id: "kidkidkidkid", name: "Kit", email: "child.abc@household.local", kind: "child" },
  { id: "fakefakefake", name: "Fake", email: "fake@example.com", kind: "adult" },
  { id: "inviterinviter", name: "Ian", email: "ian@real.com", kind: "adult" },
  { id: "teammateaaaa", name: "Tess", email: "tess@real.com", kind: "adult" },
  { id: "bothbothboth", name: "Both", email: "both@real.com", kind: "adult" },
  { id: "solosolosolo", name: "Solo", email: "solo@real.com", kind: "adult" },
];

const memberships = [
  { id: "m-ada", orgId: "org-home", memberId: "adaaaaaaaaaaaa", stance: "guardian" },
  { id: "m-kit", orgId: "org-home", memberId: "kidkidkidkid", stance: "learner" },
  { id: "m-fake", orgId: "org-home", memberId: "fakefakefake", stance: "guardian" },
  { id: "m-ian", orgId: "org-sales", memberId: "inviterinviter", stance: "trainer" },
  { id: "m-tess", orgId: "org-sales", memberId: "teammateaaaa", stance: "learner" },
  { id: "m-both", orgId: "org-sales", memberId: "bothbothboth", stance: "learner" },
  { id: "m-solo", orgId: "org-sales", memberId: "solosolosolo", stance: "learner" },
  { id: "m-import", orgId: "org-import", memberId: "teammateaaaa", stance: "learner" },
];

const wards = [
  { orgId: "org-home", guardianMembershipId: "m-ada", childMembershipId: "m-kit" },
  { orgId: "org-home", guardianMembershipId: "m-fake", childMembershipId: "m-kit" },
];

const invites = [
  { orgId: "org-sales", email: "tess@real.com", status: "accepted", invitedByMembershipId: "m-ian" },
  { orgId: "org-sales", email: "both@real.com", status: "accepted", invitedByMembershipId: "m-ian" },
  { orgId: "org-sales", email: "both@real.com", status: "accepted", invitedByMembershipId: "m-tess" },
  { orgId: "org-import", email: "tess@real.com", status: "accepted", invitedByMembershipId: "m-import" },
];

test("household guardians with children become family orgs and sales groups follow one inviter", () => {
  const excluded = planTestRows({
    orgs,
    members,
    memberships,
  }).deleteMemberIds;
  assert.deepEqual(excluded, ["fakefakefake"]);
  const plan = planBackfill({
    orgs,
    members,
    memberships,
    wards,
    invites,
    excludedMemberIds: excluded,
  });
  assert.equal(plan.families.length, 1);
  assert.equal(plan.families[0].slug, "family-adaaaaaaaaaa");
  assert.equal(plan.families[0].kind, "family");
  assert.equal(plan.families[0].homeschoolMode, true);
  assert.equal(plan.families[0].createdBy, "adaaaaaaaaaaaa");
  assert.deepEqual(plan.families[0].learnerMemberIds, ["kidkidkidkid"]);
  assert.equal(plan.teams.length, 1);
  assert.equal(plan.teams[0].slug, "team-inviterinvit");
  assert.equal(plan.teams[0].ownerMemberId, "inviterinviter");
  assert.deepEqual(plan.teams[0].learnerMemberIds, ["teammateaaaa"]);
  assert.equal(plan.teams[0].learnerMemberIds.includes("kidkidkidkid"), false);
  assert.equal(JSON.stringify(plan).includes("aecoach-north"), false);
  assert.ok(plan.skipped.some((row) => row.memberId === "bothbothboth" && row.reason === "ambiguous_inviters"));
  assert.ok(plan.skipped.some((row) => row.memberId === "solosolosolo" && row.reason === "no_invite"));
  assert.ok(plan.skipped.some((row) => row.reason === "excluded"));
  const twice = planBackfill({ orgs, members, memberships, wards, invites, excludedMemberIds: excluded });
  assert.deepEqual(twice, plan);
});

test("the backfill script makes no writes without --apply", () => {
  const dry = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/tenancy-backfill.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: "" },
  });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /mode: dry-run/);
  assert.match(dry.stdout, /writes: 0/);
  assert.doesNotMatch(dry.stdout, /applied:/);
  const remote = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/tenancy-backfill.mjs", "--apply"],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: "postgres://user:pass@db.example.com/campus" },
    },
  );
  assert.equal(remote.status, 2);
  assert.match(remote.stdout, /writes: 0/);
  assert.doesNotMatch(remote.stdout, /applied:/);
  const source = readFileSync(join(root, "scripts/tenancy-backfill.mjs"), "utf8");
  assert.match(source, /flags\.apply/);
  assert.equal(source.includes(["drizzle", "kit"].join("-")), false);
  assert.equal(readFileSync(join(root, "scripts/import-aecoach.mjs"), "utf8").includes("planBackfill"), false);
});
