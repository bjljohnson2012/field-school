import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { isResponse, jsonError, loadTaskActor, readJson } from "../../tasks/session";
import { CompareFlowError, compareDirectors } from "../load";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const targetMembershipId = typeof body.targetMembershipId === "string" ? body.targetMembershipId.trim() : "";
  const leaderMembershipId =
    typeof body.leaderMembershipId === "string" && body.leaderMembershipId.trim()
      ? body.leaderMembershipId.trim()
      : loaded.actor.membershipId;
  if (!UUID.test(targetMembershipId) || !UUID.test(leaderMembershipId)) return jsonError("invalid_body", 400);
  try {
    const result = await compareDirectors(loaded.world, loaded.actor, leaderMembershipId, targetMembershipId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CompareFlowError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
