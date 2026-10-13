import { databaseUrl, getSql } from "@/lib/db/client";
import { applyM8SqlIfConfigured } from "./m8-sql.ts";

export async function isRevokedJti(jti: string): Promise<boolean> {
  const id = jti.trim();
  if (!id || !databaseUrl()) return false;
  try {
    const ready = await applyM8SqlIfConfigured();
    if (!ready) return false;
    const sql = getSql();
    const rows = await sql<{ jti: string }[]>`
      SELECT jti FROM auth_session_revocations WHERE jti = ${id} LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}
