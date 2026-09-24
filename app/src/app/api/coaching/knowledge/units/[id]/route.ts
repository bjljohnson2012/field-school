import { NextResponse } from "next/server";
import { writeCoachingAudit } from "@/lib/coaching/audit";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../../../tasks/session";
import { loadLibraryCoach } from "../../access";
import { LibraryError, updateUnit } from "../../library";
import { isUnitStatus, isUuid } from "../../visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const { id } = await context.params;
  if (!isUuid(id)) return jsonError("invalid_body", 400);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  if (typeof body.status === "string" && !isUnitStatus(body.status)) return jsonError("invalid_body", 400);
  try {
    const saved = await updateUnit({
      orgId: loaded.actor.orgId,
      id,
      actorMembershipId: loaded.actor.membershipId,
      title: typeof body.title === "string" ? body.title : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      tags: body.tags,
      visibility: body.visibility,
      status: typeof body.status === "string" ? body.status : undefined,
    });
    if (saved.approved) {
      await writeCoachingAudit({
        orgId: loaded.actor.orgId,
        actorMembershipId: loaded.actor.membershipId,
        action: "coaching_knowledge.approve",
        targetType: "coaching_knowledge_unit",
        targetId: saved.unit.id,
        metadata: { status: "approved", visibility: saved.unit.visibility },
      });
    }
    return NextResponse.json({ ok: true, unit: saved.unit });
  } catch (error) {
    if (error instanceof LibraryError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
