import { readFileSync } from "node:fs";
import { DatabaseUnavailableError, getSql } from "./client";
import { pinnedSqlPaths } from "@/lib/pattern/load-bank";

let applied: Promise<void> | null = null;

/** Apply pinned 0002–0004. Idempotent. Does not deploy the Next app. */
export async function applyWave2Sql() {
  if (!applied) {
    applied = (async () => {
      const sql = getSql();
      const paths = pinnedSqlPaths();
      for (const path of [paths.sql2, paths.sql3, paths.sql4]) {
        await sql.unsafe(readFileSync(path, "utf8"));
      }
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyWave2SqlIfConfigured() {
  try {
    await applyWave2Sql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
