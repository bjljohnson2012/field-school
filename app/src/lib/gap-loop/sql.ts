import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";
import { applyProfileM2Sql } from "@/lib/assessments/sql";
import { applyBrainSql } from "@/lib/brain/sql";

const FILE = "0021_knowledge_gap_loop.sql";

function resolveGapSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "app"), join(here, "../../../.."), join(here, "../../../../..")];
  for (const root of roots) {
    for (const rel of [`app/db/${FILE}`, `db/${FILE}`]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`gap_loop_sql_missing:${FILE}`);
}

let applied: Promise<void> | null = null;

/** Brain tables, profile M2 tables, then 0021. Every statement is IF NOT EXISTS. */
export async function applyGapLoopSql() {
  if (!applied) {
    applied = (async () => {
      await applyBrainSql();
      await applyProfileM2Sql();
      const sql = getSql();
      await sql.unsafe(readFileSync(resolveGapSql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyGapLoopSqlIfConfigured() {
  try {
    await applyGapLoopSql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
