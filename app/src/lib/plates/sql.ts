import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";

const PINNED = "app/db/0012_plate_renders.sql";

function resolvePlateSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [
    process.cwd(),
    join(process.cwd(), ".."),
    join(process.cwd(), "app"),
    join(here, "../../../.."),
    join(here, "../../../../.."),
  ];
  for (const root of roots) {
    for (const rel of [PINNED, "db/0012_plate_renders.sql"]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`plate_sql_missing:${PINNED}`);
}

let applied: Promise<void> | null = null;

export async function applyPlateRendersSql() {
  if (!applied) {
    applied = (async () => {
      const sql = getSql();
      await sql.unsafe(readFileSync(resolvePlateSql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyPlateRendersSqlIfConfigured() {
  try {
    await applyPlateRendersSql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
