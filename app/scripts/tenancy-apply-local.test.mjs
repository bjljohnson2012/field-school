import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { applyCampusSql, assertLocalUrl, localDatabaseUrl, recreateLocalDatabase } from "./tenancy-local.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = localDatabaseUrl("tenancy_apply");

function runScript(script, args) {
  assertLocalUrl(url);
  return spawnSync(process.execPath, ["--experimental-strip-types", script, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      DATABASE_URL: url,
    },
  });
}

function slugFor(memberId, room) {
  const tail = memberId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  return `${room}-${tail}`;
}

test("apply plans run only on the local throwaway database", async () => {
  assertLocalUrl(url);
  assert.equal(new URL(url).hostname, "127.0.0.1");
  await recreateLocalDatabase("tenancy_apply");
  const files = await applyCampusSql(url);
  assert.ok(files.includes("0022_tenancy.sql"));

  const sql = postgres(url, { max: 1 });
  try {
    const ada = "11111111-1111-4111-8111-111111111111";
    const kit = "22222222-2222-4222-8222-222222222222";
    const fake = "33333333-3333-4333-8333-333333333333";
    const ian = "44444444-4444-4444-8444-444444444444";
    const tess = "55555555-5555-4555-8555-555555555555";
    const both = "66666666-6666-4666-8666-666666666666";
    const solo = "77777777-7777-4777-8777-777777777777";
    const [home] = await sql`SELECT id FROM organizations WHERE slug = 'household'`;
    const [sales] = await sql`SELECT id FROM organizations WHERE slug = 'sales'`;
    const [field] = await sql`SELECT id FROM organizations WHERE slug = 'field-school'`;
    assert.ok(home?.id && sales?.id && field?.id);

    await sql`
      INSERT INTO organizations (id, slug, name, kind, isolation)
      VALUES
        ('88888888-8888-4888-8888-888888888888', 'aecoach-north', 'North desk', 'company', 'platform_plus'),
        ('99999999-9999-4999-8999-999999999999', 'demo-family', 'Demo family', 'family', 'strict')
    `;
    await sql`
      INSERT INTO members (id, email, name, kind)
      VALUES
        (${ada}, 'ada@real.com', 'Ada', 'adult'),
        (${kit}, 'child.abc@household.local', 'Kit', 'child'),
        (${fake}, 'fake@example.com', 'Fake', 'adult'),
        (${ian}, 'ian@real.com', 'Ian', 'adult'),
        (${tess}, 'tess@real.com', 'Tess', 'adult'),
        (${both}, 'both@real.com', 'Both', 'adult'),
        (${solo}, 'solo@real.com', 'Solo', 'adult')
    `;
    await sql`
      INSERT INTO memberships (id, org_id, member_id, stance)
      VALUES
        ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ${home.id}, ${ada}, 'guardian'),
        ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', ${home.id}, ${kit}, 'learner'),
        ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', ${home.id}, ${fake}, 'guardian'),
        ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', ${sales.id}, ${ian}, 'trainer'),
        ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', ${sales.id}, ${tess}, 'learner'),
        ('ffffffff-ffff-4fff-8fff-ffffffffffff', ${sales.id}, ${both}, 'learner'),
        ('12121212-1212-4212-8212-121212121212', ${sales.id}, ${solo}, 'learner'),
        ('13131313-1313-4313-8313-131313131313', '88888888-8888-4888-8888-888888888888', ${tess}, 'learner'),
        ('14141414-1414-4414-8414-141414141414', '99999999-9999-4999-8999-999999999999', ${fake}, 'guardian')
    `;
    await sql`
      INSERT INTO wards (org_id, guardian_membership_id, child_membership_id)
      VALUES
        (${home.id}, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
        (${home.id}, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
    `;
    await sql`
      INSERT INTO invites (org_id, email, status, invited_by_membership_id, token, expires_at)
      VALUES
        (${sales.id}, 'tess@real.com', 'accepted', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'tok-tess', now() + interval '1 day'),
        (${sales.id}, 'both@real.com', 'accepted', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'tok-both-ian', now() + interval '1 day'),
        (${sales.id}, 'both@real.com', 'accepted', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'tok-both-tess', now() + interval '1 day'),
        ('88888888-8888-4888-8888-888888888888', 'tess@real.com', 'accepted', '13131313-1313-4313-8313-131313131313', 'tok-import', now() + interval '1 day')
    `;

    const before = await sql`
      SELECT
        (SELECT count(*)::int FROM organizations) AS orgs,
        (SELECT count(*)::int FROM members) AS members,
        (SELECT count(*)::int FROM memberships) AS memberships
    `;
    const dryRows = runScript("scripts/test-rows.mjs", []);
    const dryBackfill = runScript("scripts/tenancy-backfill.mjs", []);
    assert.equal(dryRows.status, 0, dryRows.stderr);
    assert.equal(dryBackfill.status, 0, dryBackfill.stderr);
    assert.match(dryRows.stdout, /mode: dry-run/);
    assert.match(dryRows.stdout, /writes: 0/);
    assert.doesNotMatch(dryRows.stdout, /applied:/);
    assert.match(dryBackfill.stdout, /mode: dry-run/);
    assert.match(dryBackfill.stdout, /writes: 0/);
    assert.doesNotMatch(dryBackfill.stdout, /applied:/);
    const afterDry = await sql`
      SELECT
        (SELECT count(*)::int FROM organizations) AS orgs,
        (SELECT count(*)::int FROM members) AS members,
        (SELECT count(*)::int FROM memberships) AS memberships
    `;
    assert.deepEqual(afterDry[0], before[0]);

    const appliedRows = runScript("scripts/test-rows.mjs", ["--apply"]);
    assert.equal(appliedRows.status, 0, appliedRows.stderr);
    assert.match(appliedRows.stdout, /applied: 1/);
    assert.match(appliedRows.stdout, /mode: apply/);
    const fakeLeft = await sql`SELECT id FROM members WHERE email = 'fake@example.com'`;
    const demoLeft = await sql`SELECT id FROM organizations WHERE slug = 'demo-family'`;
    const adaLeft = await sql`SELECT id FROM members WHERE email = 'ada@real.com'`;
    const homeLeft = await sql`SELECT slug FROM organizations WHERE slug IN ('household', 'sales', 'field-school')`;
    assert.equal(fakeLeft.length, 0);
    assert.equal(demoLeft.length, 0);
    assert.equal(adaLeft.length, 1);
    assert.deepEqual(homeLeft.map((row) => row.slug).sort(), ["field-school", "household", "sales"]);

    const appliedBackfill = runScript("scripts/tenancy-backfill.mjs", ["--apply"]);
    assert.equal(appliedBackfill.status, 0, appliedBackfill.stderr);
    assert.match(appliedBackfill.stdout, /applied: 1/);
    assert.match(appliedBackfill.stdout, /mode: apply/);
    const family = await sql`
      SELECT slug, kind, homeschool_mode, created_by
      FROM organizations
      WHERE slug = ${slugFor(ada, "family")}
    `;
    const team = await sql`
      SELECT slug, kind, homeschool_mode, created_by
      FROM organizations
      WHERE slug = ${slugFor(ian, "team")}
    `;
    assert.equal(family.length, 1);
    assert.equal(family[0].kind, "family");
    assert.equal(family[0].homeschool_mode, true);
    assert.equal(family[0].created_by, ada);
    assert.equal(team.length, 1);
    assert.equal(team[0].kind, "team");
    assert.equal(team[0].homeschool_mode, false);
    assert.equal(team[0].created_by, ian);
    const ward = await sql`
      SELECT learner.member_id
      FROM wards w
      JOIN memberships owner_row ON owner_row.id = w.guardian_membership_id
      JOIN memberships learner ON learner.id = w.child_membership_id
      JOIN organizations o ON o.id = w.org_id
      WHERE o.slug = ${slugFor(ada, "family")}
        AND owner_row.member_id = ${ada}
    `;
    assert.deepEqual(ward.map((row) => row.member_id), [kit]);
    const importMembers = await sql`
      SELECT count(*)::int AS n
      FROM memberships
      WHERE org_id = '88888888-8888-4888-8888-888888888888'
    `;
    assert.equal(importMembers[0].n, 1);

    const remote = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "scripts/tenancy-backfill.mjs", "--apply"],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          DATABASE_URL: "postgres://user:pass@db.example.com/campus",
        },
      },
    );
    assert.equal(remote.status, 2, remote.stderr);
    assert.match(remote.stdout, /writes: 0/);
    assert.doesNotMatch(remote.stdout, /applied:/);
    const familyStill = await sql`SELECT count(*)::int AS n FROM organizations WHERE slug = ${slugFor(ada, "family")}`;
    assert.equal(familyStill[0].n, 1);

    console.log(JSON.stringify({
      database: "tenancy_apply",
      host: "127.0.0.1",
      dry_test_rows: { exit: dryRows.status, stdout: dryRows.stdout },
      dry_backfill: { exit: dryBackfill.status, stdout: dryBackfill.stdout },
      apply_test_rows: { exit: appliedRows.status, stdout: appliedRows.stdout },
      apply_backfill: { exit: appliedBackfill.status, stdout: appliedBackfill.stdout },
      remote_apply: { exit: remote.status, stdout: remote.stdout },
      removed: ["fake@example.com", "demo-family"],
      created: [family[0].slug, team[0].slug],
    }));
  } finally {
    await sql.end({ timeout: 1 });
  }
});
