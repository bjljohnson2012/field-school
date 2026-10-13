import { applyBackfillPlan, openCampus, tenancyModules } from "./tenancy-db.mjs";

const { testRows, backfill, script } = await tenancyModules();
const flags = script.scriptFlags(process.argv.slice(2));
const url = process.env.DATABASE_URL?.trim() ?? "";
const refusal = script.refuseRemoteApply(url, flags);

function printCounts(counts) {
  for (const [key, value] of Object.entries(counts)) {
    console.log(`${key}: ${value}`);
  }
}

if (refusal || !url) {
  console.log("mode: dry-run");
  console.log(!url || refusal === "database_missing" ? "database: missing" : "refused: remote");
  printCounts({ families: 0, teams: 0, memberships: 0, wards: 0, skipped: 0, excluded: 0 });
  console.log("writes: 0");
  process.exit(refusal ? 2 : 0);
}

const db = await openCampus(url);
try {
  const exclusion = testRows.planTestRows(db);
  const plan = backfill.planBackfill({
    orgs: db.orgs,
    members: db.members,
    memberships: db.memberships,
    wards: db.wards,
    invites: db.invites,
    excludedMemberIds: exclusion.deleteMemberIds,
  });
  console.log(`mode: ${flags.mode}`);
  printCounts(plan.counts);
  console.log("templates_kept: household,sales");
  if (!flags.apply) {
    console.log("writes: 0");
    process.exit(0);
  }
  await applyBackfillPlan(db.sql, plan);
  console.log("applied: 1");
} finally {
  await db.sql.end({ timeout: 1 });
}
