import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

/** JSON-safe tool payload (avoid `unknown` for server-fn serialization). */
export type ToolResultPayload = Record<
  string,
  string | number | boolean | null
>;

export type ToolResultRow = {
  toolSlug: string;
  result: ToolResultPayload;
  status: string;
  updatedAt: string;
};

export const listMyToolResults = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ToolResultRow[]> => {
    const sql = await getSql();
    const rows = await sql<{
      tool_slug: string;
      result_json: string;
      status: string;
      updated_at: string;
    }>`
      select tool_slug, result_json, status, updated_at
      from tool_results
      where user_id = ${context.userId}
      order by updated_at desc
    `;
    return rows.map(
      (r): ToolResultRow => ({
        toolSlug: r.tool_slug,
        result: safePayload(r.result_json),
        status: r.status,
        updatedAt: String(r.updated_at),
      }),
    );
  });

export const getMyToolResult = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { toolSlug: string }) => d)
  .handler(async ({ context, data }): Promise<ToolResultRow | null> => {
    const sql = await getSql();
    const rows = await sql<{
      tool_slug: string;
      result_json: string;
      status: string;
      updated_at: string;
    }>`
      select tool_slug, result_json, status, updated_at
      from tool_results
      where user_id = ${context.userId} and tool_slug = ${data.toolSlug}
      limit 1
    `;
    const r = rows[0];
    if (!r) return null;
    return {
      toolSlug: r.tool_slug,
      result: safePayload(r.result_json),
      status: r.status,
      updatedAt: String(r.updated_at),
    };
  });

export const saveMyToolResult = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      toolSlug: string;
      result: ToolResultPayload;
      status?: "started" | "complete";
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const payload = JSON.stringify(data.result ?? {});
    const status = data.status ?? "started";
    await sql`
      insert into tool_results (user_id, tool_slug, result_json, status, updated_at)
      values (${context.userId}, ${data.toolSlug}, ${payload}, ${status}, now())
      on conflict (user_id, tool_slug) do update set
        result_json = excluded.result_json,
        status = excluded.status,
        updated_at = now()
    `;
    return { ok: true as const };
  });

function safePayload(raw: string): ToolResultPayload {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: ToolResultPayload = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        v === null
      ) {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}
