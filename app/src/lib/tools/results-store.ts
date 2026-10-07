import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { toolResults } from "@/lib/db/schema";
import { applyProfileSql } from "@/lib/profile/sql";
import { isSavedTool, scoreSubmission, type ToolResult, type ToolSubmission } from "./results";

function numberRecord(raw: unknown): Record<string, number> | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "number") return null;
    out[key] = value;
  }
  return out;
}

function stringRecord(raw: unknown): Record<string, string> | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string") return null;
    out[key] = value;
  }
  return out;
}

function readRow(row: typeof toolResults.$inferSelect): ToolResult | null {
  const answers = numberRecord(row.answers);
  const scores = numberRecord(row.scores);
  const labels = stringRecord(row.labels);
  if (!isSavedTool(row.toolSlug) || !answers || !scores || !labels) return null;
  return {
    toolSlug: row.toolSlug,
    attemptId: row.attemptId,
    answers,
    completedAt: row.completedAt.toISOString(),
    summary: row.summary,
    scores,
    labels,
  };
}

/**
 * Scores on the server and stores one row per attempt. The first save of an attempt wins:
 * a retry returns that row with created=false and changes nothing.
 */
export async function saveToolResult(
  memberId: string,
  submission: ToolSubmission,
  now = new Date(),
): Promise<{ result: ToolResult; created: boolean }> {
  await applyProfileSql();
  const scored = scoreSubmission(submission, now);
  const db = getDb();
  const inserted = await db
    .insert(toolResults)
    .values({
      memberId,
      toolSlug: scored.toolSlug,
      attemptId: scored.attemptId,
      answers: scored.answers,
      summary: scored.summary,
      scores: scored.scores,
      labels: scored.labels,
      completedAt: now,
    })
    .onConflictDoNothing()
    .returning();
  const fresh = inserted[0] ? readRow(inserted[0]) : null;
  if (fresh) return { result: fresh, created: true };
  const [existing] = await db
    .select()
    .from(toolResults)
    .where(and(eq(toolResults.memberId, memberId), eq(toolResults.attemptId, submission.attemptId)))
    .limit(1);
  const first = existing ? readRow(existing) : null;
  if (!first) throw new Error("tool_results row unreadable");
  return { result: first, created: false };
}

/** Oldest first. Private to the User: there is no org-scoped read of this table. */
export async function listToolResults(memberId: string): Promise<ToolResult[]> {
  await applyProfileSql();
  const rows = await getDb()
    .select()
    .from(toolResults)
    .where(eq(toolResults.memberId, memberId))
    .orderBy(asc(toolResults.completedAt));
  return rows.flatMap((row) => readRow(row) ?? []);
}
