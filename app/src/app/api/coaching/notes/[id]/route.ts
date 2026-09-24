import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { assertCanAccessMember } from "@/lib/coaching/access";
import { writeCoachingAudit } from "@/lib/coaching/audit";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { coachingNotes } from "@/lib/db/schema";
import { isResponse, jsonError, loadTaskActor, readJson } from "../../tasks/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError("not_found", 404);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  try {
    const db = getDb();
    const [existing] = await db.select().from(coachingNotes).where(eq(coachingNotes.id, id)).limit(1);
    if (!existing || existing.orgId !== loaded.actor.orgId) return jsonError("not_found", 404);
    if (!assertCanAccessMember(loaded.world, loaded.actor, existing.subjectMembershipId)) {
      return jsonError("forbidden", 403);
    }
    const visibleToLearner =
      typeof body.visibleToLearner === "boolean" ? body.visibleToLearner : !existing.visibleToLearner;
    const [saved] = await db
      .update(coachingNotes)
      .set({ visibleToLearner, updatedAt: new Date() })
      .where(eq(coachingNotes.id, existing.id))
      .returning();
    if (!saved) return jsonError("not_found", 404);
    await writeCoachingAudit({
      orgId: saved.orgId,
      actorMembershipId: loaded.actor.membershipId,
      action: "coaching_note.visibility",
      targetType: "coaching_note",
      targetId: saved.id,
      metadata: { visibleToLearner: saved.visibleToLearner, previous: existing.visibleToLearner },
    });
    return NextResponse.json({
      ok: true,
      note: {
        id: saved.id,
        subjectMembershipId: saved.subjectMembershipId,
        authorMembershipId: saved.authorMembershipId,
        body: saved.body,
        visibleToLearner: saved.visibleToLearner,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
