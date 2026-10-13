import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));

export const LOCAL_HOST = "127.0.0.1";

export function assertLocalUrl(url) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("refusing_remote:unparsed");
  }
  if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
    throw new Error(`refusing_remote:${host}`);
  }
}

export function localDatabaseUrl(name) {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error(`bad_db:${name}`);
  const url = `postgres://tenancy:tenancy@${LOCAL_HOST}:5432/${name}`;
  assertLocalUrl(url);
  return url;
}

export async function recreateLocalDatabase(name) {
  if (!/^[a-z][a-z0-9_]*$/.test(name) || name === "postgres") throw new Error(`bad_db:${name}`);
  const adminUrl = localDatabaseUrl("postgres");
  const sql = postgres(adminUrl, { max: 1 });
  try {
    await sql.unsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${name}' AND pid <> pg_backend_pid()`,
    );
    await sql.unsafe(`DROP DATABASE IF EXISTS ${name}`);
    await sql.unsafe(`CREATE DATABASE ${name} OWNER tenancy`);
  } finally {
    await sql.end({ timeout: 1 });
  }
}

export async function applyCampusSql(url) {
  assertLocalUrl(url);
  const sql = postgres(url, { max: 1 });
  const dir = join(here, "../db");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  try {
    for (const name of files) {
      await sql.unsafe(readFileSync(join(dir, name), "utf8"));
    }
  } finally {
    await sql.end({ timeout: 1 });
  }
  return files;
}
