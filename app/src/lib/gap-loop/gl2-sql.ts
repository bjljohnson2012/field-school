import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyM11Sql } from "@/lib/brains/sql";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";

const FILE = "0029_gl2_gap_loop.sql";

function resolveGl2Sql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "app"), join(here, "../../../.."), join(here, "../../../../..")];
  for (const root of roots) {
    for (const rel of [`app/db/${FILE}`, `db/${FILE}`]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`gl2_sql_missing:${FILE}`);
}

let applied: Promise<void> | null = null;

/** M11 brains, then 0029. Embedding column and spend ledger. Idempotent. */
export async function applyGl2Sql() {
  if (!applied) {
    applied = (async () => {
      await applyM11Sql();
      const sql = getSql();
      await sql.unsafe(readFileSync(resolveGl2Sql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyGl2SqlIfConfigured() {
  try {
    await applyGl2Sql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
