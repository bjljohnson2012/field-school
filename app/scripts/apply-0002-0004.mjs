import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const repoRoot = join(appRoot, "..");

const FILES = [
  "app/db/0002_field_pattern.sql",
  "app/db/0003_pattern_weights.sql",
  "app/db/0004_tenants.sql",
];

function resolveSql(rel) {
  for (const root of [repoRoot, appRoot, process.cwd(), join(process.cwd(), "..")]) {
    const full = join(root, rel);
    const alt = join(root, rel.replace(/^app\//, ""));
    if (existsSync(full)) return full;
    if (existsSync(alt)) return alt;
  }
  throw new Error(`missing ${rel}`);
}

export function wave2SqlPaths() {
  return FILES.map(resolveSql);
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const url = process.env.DATABASE_URL?.trim();
  if (url && !process.env.WAVE2_APPLY_DRY) {
    const sql = postgres(url, { max: 1 });
    for (const path of wave2SqlPaths()) {
      await sql.unsafe(readFileSync(path, "utf8"));
      console.log(`applied ${path}`);
    }
    await sql.end();
  } else {
    for (const path of wave2SqlPaths()) {
      console.log(`ready ${path}`);
    }
    if (!url) console.log("skip apply: DATABASE_URL unset");
  }
}
