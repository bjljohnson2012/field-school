import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSql } from "@/lib/db/client";
import { applyProfileSql } from "@/lib/profile/sql";

const FILES = ["0019_assessments.sql", "0020_profile_enrichment.sql"] as const;

function resolve(file: string) {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "app"), join(here, "../../../.."), join(here, "../../../../..")];
  for (const root of roots) {
    for (const rel of [`app/db/${file}`, `db/${file}`]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`profile_m2_sql_missing:${file}`);
}

let applied: Promise<void> | null = null;

/** Applies 0017 first (user_profiles), then the M2+ tables. Every statement is IF NOT EXISTS. */
export async function applyProfileM2Sql() {
  if (!applied) {
    applied = (async () => {
      await applyProfileSql();
      const sql = getSql();
      for (const file of FILES) await sql.unsafe(readFileSync(resolve(file), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}
