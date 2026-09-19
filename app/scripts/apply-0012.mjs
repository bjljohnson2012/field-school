import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const repoRoot = join(appRoot, "..");
const REL = "app/db/0012_plate_renders.sql";

function resolveSql() {
  for (const root of [repoRoot, appRoot, process.cwd(), join(process.cwd(), "..")]) {
    const full = join(root, REL);
    const alt = join(root, "db/0012_plate_renders.sql");
    if (existsSync(full)) return full;
    if (existsSync(alt)) return alt;
  }
  throw new Error(`missing ${REL}`);
}

export function plateRendersSqlPath() {
  return resolveSql();
}

const invokedDirectly =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (invokedDirectly) {
  const path = plateRendersSqlPath();
  const url = process.env.DATABASE_URL?.trim();
  const live = /fieldschool|2\.24\.70\.248|portal/.test(url || "");
  if (url && !process.env.PLATE_0012_DRY && !live) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 1 });
    await sql.unsafe(readFileSync(path, "utf8"));
    console.log(`applied ${path}`);
    await sql.end();
  } else {
    console.log(`ready ${path}`);
    if (!url) console.log("skip apply: DATABASE_URL unset (dry-run)");
    if (live) console.log("skip apply: refuse live VPS");
  }
}
