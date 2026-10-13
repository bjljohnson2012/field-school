import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { classifyMember, deleteOrder, planTestRows } from "../src/lib/tenancy/test-rows.ts";
import { refuseRemoteApply, scriptFlags } from "../src/lib/tenancy/script.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function runScript(args, env = {}) {
  return spawnSync(process.execPath, ["--experimental-strip-types", "scripts/test-rows.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: "", ...env },
  });
}

test("clear test rows are removed and ambiguous rows are kept", () => {
  assert.equal(classifyMember({ id: "1", email: "ada@example.com", kind: "adult", hasCredential: true }), "delete");
  assert.equal(classifyMember({ id: "1", email: "child@example.com", kind: "child" }), "delete");
  assert.equal(classifyMember({ id: "1", email: "testing@gmail.com", kind: "adult", hasCredential: true }), "keep");
  assert.equal(classifyMember({ id: "1", email: "contest@gmail.com", kind: "adult", hasCredential: true }), "keep");
  assert.equal(classifyMember({ id: "1", email: "testa@gmail.com", kind: "adult", hasCredential: true }), "keep");
  assert.equal(classifyMember({ id: "1", email: "ada+test@gmail.com", kind: "adult", hasCredential: true }), "delete");
  assert.equal(
    classifyMember({ id: "1", email: "bjljohnson2012+desk@gmail.com", kind: "adult", hasCredential: true }),
    "delete",
  );
  assert.equal(
    classifyMember({ id: "1", email: "bjljohnson2012@gmail.com", kind: "adult", authUserId: null }),
    "keep",
  );
  assert.equal(classifyMember({ id: "1", email: "ben@gmail.com", kind: "adult", hasCredential: true }), "keep");
  assert.equal(classifyMember({ id: "1", email: "ben+test@gmail.com", kind: "adult", hasCredential: true }), "delete");
  assert.equal(
    classifyMember({ id: "1", email: "child.abc@household.local", kind: "child" }),
    "keep",
  );
  assert.equal(
    classifyMember({ id: "1", email: "real@gmail.com", kind: "adult", authUserId: null, hasCredential: false }),
    "ambiguous",
  );
  assert.equal(classifyMember({ id: "1", email: "ghost@localhost", kind: "adult" }), "delete");
  assert.equal(classifyMember({ id: "1", email: "ghost@localhost", kind: "child" }), "keep");

  const plan = planTestRows({
    orgs: [
      { id: "org-field", slug: "field-school", name: "Field School" },
      { id: "org-home", slug: "household", name: "Household" },
      { id: "org-sales", slug: "sales", name: "Sales team" },
      { id: "org-demo", slug: "demo-family", name: "Demo family" },
      { id: "org-mixed", slug: "example-team", name: "Example team" },
      { id: "org-real", slug: "family-ada", name: "Ada family" },
    ],
    members: [
      { id: "dean", email: "bjljohnson2012@gmail.com", kind: "adult", hasCredential: true },
      { id: "ada", email: "ada@gmail.com", kind: "adult", hasCredential: true },
      { id: "kid", email: "child.abc@household.local", kind: "child" },
      { id: "fake", email: "fake@example.com", kind: "adult", hasCredential: true },
      { id: "maybe", email: "maybe@gmail.com", kind: "adult", authUserId: null, hasCredential: false },
      { id: "demo-user", email: "demo.user@example.com", kind: "adult" },
    ],
    memberships: [
      { id: "m-dean", orgId: "org-field", memberId: "dean" },
      { id: "m-ada", orgId: "org-home", memberId: "ada" },
      { id: "m-kid", orgId: "org-home", memberId: "kid" },
      { id: "m-fake", orgId: "org-demo", memberId: "fake" },
      { id: "m-maybe", orgId: "org-mixed", memberId: "maybe" },
      { id: "m-demo", orgId: "org-mixed", memberId: "demo-user" },
      { id: "m-real-fake", orgId: "org-real", memberId: "fake" },
    ],
  });
  assert.deepEqual([...plan.deleteMemberIds].sort(), ["demo-user", "fake"]);
  assert.deepEqual(plan.ambiguousMemberIds, ["maybe"]);
  assert.deepEqual(plan.deleteOrgIds, ["org-demo"]);
  assert.deepEqual(plan.ambiguousOrgIds, ["org-mixed"]);
  assert.equal(plan.deleteOrgIds.includes("org-field"), false);
  assert.equal(plan.deleteOrgIds.includes("org-home"), false);
  assert.equal(plan.deleteOrgIds.includes("org-sales"), false);
  assert.equal(plan.deleteOrgIds.includes("org-real"), false);
  assert.ok(plan.deleteMembershipIds.includes("m-fake"));
  assert.ok(plan.deleteMembershipIds.includes("m-real-fake"));
  assert.equal(plan.deleteMembershipIds.includes("m-ada"), false);
  assert.equal(plan.deleteMembershipIds.includes("m-kid"), false);
  const again = planTestRows({
    orgs: [
      { id: "org-field", slug: "field-school", name: "Field School" },
      { id: "org-home", slug: "household", name: "Household" },
      { id: "org-sales", slug: "sales", name: "Sales team" },
      { id: "org-demo", slug: "demo-family", name: "Demo family" },
      { id: "org-mixed", slug: "example-team", name: "Example team" },
      { id: "org-real", slug: "family-ada", name: "Ada family" },
    ],
    members: [
      { id: "dean", email: "bjljohnson2012@gmail.com", kind: "adult", hasCredential: true },
      { id: "ada", email: "ada@gmail.com", kind: "adult", hasCredential: true },
      { id: "kid", email: "child.abc@household.local", kind: "child" },
      { id: "fake", email: "fake@example.com", kind: "adult", hasCredential: true },
      { id: "maybe", email: "maybe@gmail.com", kind: "adult", authUserId: null, hasCredential: false },
      { id: "demo-user", email: "demo.user@example.com", kind: "adult" },
    ],
    memberships: [
      { id: "m-dean", orgId: "org-field", memberId: "dean" },
      { id: "m-ada", orgId: "org-home", memberId: "ada" },
      { id: "m-kid", orgId: "org-home", memberId: "kid" },
      { id: "m-fake", orgId: "org-demo", memberId: "fake" },
      { id: "m-maybe", orgId: "org-mixed", memberId: "maybe" },
      { id: "m-demo", orgId: "org-mixed", memberId: "demo-user" },
      { id: "m-real-fake", orgId: "org-real", memberId: "fake" },
    ],
  });
  assert.deepEqual(again, plan);
});

test("dependent tables are deleted before the rows they reference", () => {
  assert.deepEqual(
    deleteOrder(
      ["wards", "memberships", "members"],
      [
        { from: "wards", to: "memberships" },
        { from: "memberships", to: "members" },
      ],
    ),
    ["wards", "memberships", "members"],
  );
});

test("apply stays off unless asked, and a remote url is refused", () => {
  assert.equal(scriptFlags([]).apply, false);
  assert.equal(scriptFlags(["--dry-run"]).mode, "dry-run");
  assert.equal(scriptFlags(["--apply", "--dry-run"]).apply, false);
  assert.equal(refuseRemoteApply("postgres://user:pass@db.example.com/campus", scriptFlags(["--apply"])), "refusing_remote_apply");
  assert.equal(
    refuseRemoteApply("postgres://user:pass@127.0.0.1/campus", { apply: true, allowRemote: false }),
    null,
  );
  const dry = runScript([]);
  assert.equal(dry.status, 0);
  assert.match(dry.stdout, /mode: dry-run/);
  assert.match(dry.stdout, /writes: 0/);
  assert.doesNotMatch(dry.stdout, /applied:/);
  const remote = runScript(["--apply"], { DATABASE_URL: "postgres://user:pass@db.example.com/campus" });
  assert.equal(remote.status, 2);
  assert.match(remote.stdout, /refused: remote/);
  assert.match(remote.stdout, /writes: 0/);
  assert.doesNotMatch(remote.stdout, /applied:/);
  const source = readFileSync(join(root, "scripts/test-rows.mjs"), "utf8");
  assert.match(source, /flags\.apply/);
  assert.equal(source.includes(["drizzle", "kit"].join("-")), false);
});
