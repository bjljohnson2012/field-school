import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";

const PINNED = "app/db/0005_composer.sql";

function resolveComposerSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [
    process.cwd(),
    join(process.cwd(), ".."),
    join(process.cwd(), "app"),
    join(here, "../../../.."),
    join(here, "../../../../.."),
  ];
  for (const root of roots) {
    for (const rel of [PINNED, "db/0005_composer.sql"]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`composer_sql_missing:${PINNED}`);
}

let applied: Promise<void> | null = null;

export async function applyComposerSql() {
  if (!applied) {
    applied = (async () => {
      const sql = getSql();
      await sql.unsafe(readFileSync(resolveComposerSql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyComposerSqlIfConfigured() {
  try {
    await applyComposerSql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
