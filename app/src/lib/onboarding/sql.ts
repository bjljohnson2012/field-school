import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseUnavailableError, getSql } from "@/lib/db/client";

const SQL_PATH = join(dirname(fileURLToPath(import.meta.url)), "../../../db/0027_m12_onboarding.sql");

let applied: Promise<void> | null = null;

export async function applyOnboardingSql() {
  if (!applied) {
    applied = (async () => {
      const sql = getSql();
      await sql.unsafe(readFileSync(SQL_PATH, "utf8"));
    })();
  }
  try {
    await applied;
  } catch (error) {
    applied = null;
    throw error;
  }
}

export async function applyOnboardingSqlIfConfigured() {
  try {
    await applyOnboardingSql();
    return true;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return false;
    throw error;
  }
}
