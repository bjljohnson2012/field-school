import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";
import { applyCurriculumSqlIfConfigured } from "@/lib/curriculum/sql";

const PINNED = "app/db/0008_next_portions.sql";

function resolvePortionSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [
    process.cwd(),
    join(process.cwd(), ".."),
    join(process.cwd(), "app"),
    join(here, "../../../.."),
    join(here, "../../../../.."),
  ];
  for (const root of roots) {
    for (const rel of [PINNED, "db/0008_next_portions.sql"]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`portion_sql_missing:${PINNED}`);
}

let applied: Promise<void> | null = null;

export async function applyPortionSql() {
  await applyCurriculumSqlIfConfigured();
  if (!applied) {
    applied = (async () => {
      const sql = getSql();
      await sql.unsafe(readFileSync(resolvePortionSql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyPortionSqlIfConfigured() {
  try {
    await applyPortionSql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
