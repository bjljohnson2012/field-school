import { NextResponse } from "next/server";
import { generateTaskDescription } from "@/lib/ai/prompts/loop";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { canAssign } from "../access";
import { assigneeCoachingContext } from "../persist";
import { isResponse, jsonError, loadTaskActor, readJson } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return jsonError("invalid_body", 400);
  const assigneeMembershipId =
    typeof body.assigneeMembershipId === "string" && body.assigneeMembershipId.trim()
      ? body.assigneeMembershipId.trim()
      : loaded.actor.membershipId;
  if (!canAssign(loaded.world, loaded.actor, assigneeMembershipId)) {
    return jsonError("forbidden", 403);
  }
  const context = await assigneeCoachingContext(loaded.actor.orgId, assigneeMembershipId);
  try {
    const description = await generateTaskDescription({
      title,
      aeName: context.aeName,
      weaknesses: context.weaknesses,
      strengths: context.strengths,
      skillScores: context.skillScores,
    });
    return NextResponse.json({ ok: true, description });
  } catch {
    return jsonError("ai_unavailable", 502);
  }
}
