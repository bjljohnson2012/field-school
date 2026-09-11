import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export class DatabaseUnavailableError extends Error {
  constructor(message = "DATABASE_URL is not set") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

const globalForDb = globalThis as unknown as {
  campusSql?: ReturnType<typeof postgres>;
  campusDb?: ReturnType<typeof drizzle<typeof schema>>;
};

export function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || "";
}

export function getDb() {
  const url = databaseUrl();
  if (!url) throw new DatabaseUnavailableError();
  if (!globalForDb.campusSql) {
    globalForDb.campusSql = postgres(url, { max: 8 });
    globalForDb.campusDb = drizzle(globalForDb.campusSql, { schema });
  }
  return globalForDb.campusDb!;
}

export function getSql() {
  const url = databaseUrl();
  if (!url) throw new DatabaseUnavailableError();
  if (!globalForDb.campusSql) {
    globalForDb.campusSql = postgres(url, { max: 8 });
    globalForDb.campusDb = drizzle(globalForDb.campusSql, { schema });
  }
  return globalForDb.campusSql;
}
