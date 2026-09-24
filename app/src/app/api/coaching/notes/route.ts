import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { assertCanAccessMember } from "@/lib/coaching/access";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { coachingNotes } from "@/lib/db/schema";
import { isResponse, jsonError, loadTaskActor, readJson } from "../tasks/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function visibleNoteRows<T extends { visibleToLearner: boolean }>(
  rows: T[],
  actorMembershipId: string,
  subjectMembershipId: string,
) {
  if (actorMembershipId === subjectMembershipId) return rows.filter((row) => row.visibleToLearner);
  return rows;
}

function noteDto(row: typeof coachingNotes.$inferSelect) {
  return {
    id: row.id,
    subjectMembershipId: row.subjectMembershipId,
    authorMembershipId: row.authorMembershipId,
    body: row.body,
    visibleToLearner: row.visibleToLearner,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const subjectMembershipId = new URL(request.url).searchParams.get("subjectMembershipId")?.trim() ?? "";
  if (!UUID.test(subjectMembershipId)) return jsonError("invalid_body", 400);
  if (!assertCanAccessMember(loaded.world, loaded.actor, subjectMembershipId)) {
    return jsonError("forbidden", 403);
  }
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(coachingNotes)
      .where(
        and(
          eq(coachingNotes.orgId, loaded.actor.orgId),
          eq(coachingNotes.subjectMembershipId, subjectMembershipId),
        ),
      )
      .orderBy(desc(coachingNotes.createdAt));
    const notes = visibleNoteRows(rows, loaded.actor.membershipId, subjectMembershipId).map(noteDto);
    return NextResponse.json({ ok: true, notes });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const subjectMembershipId = typeof body.subjectMembershipId === "string" ? body.subjectMembershipId.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!UUID.test(subjectMembershipId) || !text) return jsonError("invalid_body", 400);
  if (!assertCanAccessMember(loaded.world, loaded.actor, subjectMembershipId)) {
    return jsonError("forbidden", 403);
  }
  try {
    const db = getDb();
    const [created] = await db
      .insert(coachingNotes)
      .values({
        orgId: loaded.actor.orgId,
        authorMembershipId: loaded.actor.membershipId,
        subjectMembershipId,
        body: text,
        visibleToLearner: body.visibleToLearner === true,
      })
      .returning();
    if (!created) return jsonError("note_unavailable", 500);
    return NextResponse.json({ ok: true, note: noteDto(created) });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
