import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyProfileM2Sql } from "@/lib/assessments/sql";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";

const FILE = "0031_pm4_profile.sql";

function resolvePm4Sql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "app"), join(here, "../../../.."), join(here, "../../../../..")];
  for (const root of roots) {
    for (const rel of [`app/db/${FILE}`, `db/${FILE}`]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`pm4_profile_sql_missing:${FILE}`);
}

let applied: Promise<void> | null = null;

/** Profile M2 tables, then 0031. Does not apply 0029 or edit 0030. */
export async function applyPm4Sql() {
  if (!applied) {
    applied = (async () => {
      await applyProfileM2Sql();
      const sql = getSql();
      await sql.unsafe(readFileSync(resolvePm4Sql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyPm4SqlIfConfigured() {
  try {
    await applyPm4Sql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
