import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";
import { applyProfileM2Sql } from "@/lib/assessments/sql";

const FILE = "0030_pm3_profile.sql";

function resolvePm3Sql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "app"), join(here, "../../../.."), join(here, "../../../../..")];
  for (const root of roots) {
    for (const rel of [`app/db/${FILE}`, `db/${FILE}`]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`pm3_profile_sql_missing:${FILE}`);
}

let applied: Promise<void> | null = null;

/** Profile tables, then 0030. Statements are idempotent. Does not apply 0029. */
export async function applyPm3Sql() {
  if (!applied) {
    applied = (async () => {
      await applyProfileM2Sql();
      const sql = getSql();
      await sql.unsafe(readFileSync(resolvePm3Sql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyPm3SqlIfConfigured() {
  try {
    await applyPm3Sql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
