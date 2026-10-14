/**
 * M11 backfill dry run. Prints per-store counts. Does not open a production database.
 * --apply replans the fixture after the first plan and prints the second dry run.
 */
import { FIXTURE_BACKFILL, applyBackfill, formatDryRun, planBackfill } from "../src/lib/brains/backfill.ts";

const apply = process.argv.includes("--apply");
if (apply && process.env.M11_BACKFILL_APPLY !== "local") {
  console.error("apply_refused");
  process.exit(1);
}

const first = planBackfill(FIXTURE_BACKFILL);
if (!apply) {
  console.log(formatDryRun(first.counts, first.plannedInserts));
  process.exit(0);
}

const applied = applyBackfill(FIXTURE_BACKFILL);
const second = planBackfill({ ...FIXTURE_BACKFILL, existingNodes: applied.existingNodes });
console.log(formatDryRun(second.counts, second.plannedInserts));
