import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { jsonError, loadTaskActor } from "../../../tasks/session";
import { PlanFlowError, retryPlan } from "../../run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError("not_found", 404);
  try {
    const plan = await retryPlan(loaded.world, loaded.actor, id);
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    if (error instanceof PlanFlowError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
