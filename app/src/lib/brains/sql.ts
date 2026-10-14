import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";
import { applyGapLoopSql } from "@/lib/gap-loop/sql";

const FILE = "0028_m11_brains.sql";

function resolveM11Sql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "app"), join(here, "../../../.."), join(here, "../../../../..")];
  for (const root of roots) {
    for (const rel of [`app/db/${FILE}`, `db/${FILE}`]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`m11_brains_sql_missing:${FILE}`);
}

let applied: Promise<void> | null = null;

/** Gap-loop tables, then 0028. Kind and origin checks are idempotent. */
export async function applyM11Sql() {
  if (!applied) {
    applied = (async () => {
      await applyGapLoopSql();
      const sql = getSql();
      await sql.unsafe(readFileSync(resolveM11Sql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyM11SqlIfConfigured() {
  try {
    await applyM11Sql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
