import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";

const FILE = "0032_gl3_individual_plan.sql";

function resolveSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "app"), join(here, "../../../.."), join(here, "../../../../..")];
  for (const root of roots) {
    for (const rel of [`app/db/${FILE}`, `db/${FILE}`]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`gl3_sql_missing:${FILE}`);
}

let applied: Promise<void> | null = null;

export async function applyIndividualPlanSql() {
  if (!applied) {
    applied = (async () => {
      const sql = getSql();
      await sql.unsafe(readFileSync(resolveSql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyIndividualPlanSqlIfConfigured() {
  try {
    await applyIndividualPlanSql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
