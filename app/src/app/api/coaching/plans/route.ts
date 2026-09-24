import { NextResponse } from "next/server";
import { assertCanAccessMember } from "@/lib/coaching/access";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { isResponse, jsonError, loadTaskActor, readJson } from "../tasks/session";
import { PlanFlowError, generatePlan, listPlans } from "./run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const subjectMembershipId = new URL(request.url).searchParams.get("subjectMembershipId")?.trim() ?? "";
  if (!UUID.test(subjectMembershipId)) return jsonError("invalid_body", 400);
  if (!assertCanAccessMember(loaded.world, loaded.actor, subjectMembershipId)) {
    return jsonError("forbidden", 403);
  }
  try {
    const plans = await listPlans(loaded.actor, subjectMembershipId);
    return NextResponse.json({ ok: true, plans });
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
  if (!UUID.test(subjectMembershipId)) return jsonError("invalid_body", 400);
  if (!assertCanAccessMember(loaded.world, loaded.actor, subjectMembershipId)) {
    return jsonError("forbidden", 403);
  }
  try {
    const plan = await generatePlan(loaded.world, loaded.actor, subjectMembershipId);
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    if (error instanceof PlanFlowError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
