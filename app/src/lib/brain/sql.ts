import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";
import { applyLedgerSqlIfConfigured } from "@/lib/ledger/sql";

const PINNED = "app/db/0010_knowledge_brains.sql";

function resolveBrainSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  const roots = [
    process.cwd(),
    join(process.cwd(), ".."),
    join(process.cwd(), "app"),
    join(here, "../../../.."),
    join(here, "../../../../.."),
  ];
  for (const root of roots) {
    for (const rel of [PINNED, "db/0010_knowledge_brains.sql"]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`brain_sql_missing:${PINNED}`);
}

let applied: Promise<void> | null = null;

export async function applyBrainSql() {
  await applyLedgerSqlIfConfigured();
  if (!applied) {
    applied = (async () => {
      const sql = getSql();
      await sql.unsafe(readFileSync(resolveBrainSql(), "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyBrainSqlIfConfigured() {
  try {
    await applyBrainSql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
