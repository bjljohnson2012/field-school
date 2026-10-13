import { applyTestRowPlan, countTestRowTables, openCampus, tenancyModules } from "./tenancy-db.mjs";

const { testRows, script } = await tenancyModules();
const flags = script.scriptFlags(process.argv.slice(2));
const url = process.env.DATABASE_URL?.trim() ?? "";
const refusal = script.refuseRemoteApply(url, flags);

function printCounts(counts) {
  for (const [key, value] of Object.entries(counts)) {
    console.log(`${key}: ${value}`);
  }
}

if (refusal) {
  console.log("mode: dry-run");
  console.log(refusal === "database_missing" ? "database: missing" : "refused: remote");
  console.log("writes: 0");
  process.exit(refusal === "database_missing" ? 2 : 2);
}

if (!url) {
  console.log("mode: dry-run");
  console.log("database: missing");
  printCounts({
    members: 0,
    memberships: 0,
    organizations: 0,
    ambiguous_members: 0,
    ambiguous_orgs: 0,
  });
  console.log("writes: 0");
  process.exit(0);
}

const db = await openCampus(url);
try {
  const plan = testRows.planTestRows(db);
  console.log(`mode: ${flags.mode}`);
  printCounts(plan.counts);
  const tables = await countTestRowTables(db.sql, plan, testRows.deleteOrder);
  for (const row of tables) console.log(`table ${row.table}: ${row.count}`);
  console.log(`ambiguous_kept: ${plan.ambiguousMemberIds.length + plan.ambiguousOrgIds.length}`);
  if (!flags.apply) {
    console.log("writes: 0");
    process.exit(0);
  }
  await applyTestRowPlan(db.sql, plan, testRows.deleteOrder);
  console.log("applied: 1");
} finally {
  await db.sql.end({ timeout: 1 });
}
