import { NextResponse } from "next/server";
import { generateTasksForAe } from "@/lib/ai/prompts/loop";
import { memberHasPlatformAdmin } from "@/lib/coaching/access";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { canAssign } from "../access";
import { TaskError, assigneeCoachingContext, insertGeneratedTasks } from "../persist";
import { isResponse, jsonError, loadTaskActor, readJson } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function roleFor(stance: string, platform: boolean) {
  if (platform) return "COMPANY_ADMIN" as const;
  if (stance === "leader") return "VP_SALES" as const;
  if (stance === "coach") return "DIRECTOR" as const;
  if (stance === "admin") return "ORG_ADMIN" as const;
  return "AE" as const;
}

function boundedCount(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 5;
  return Math.min(5, Math.max(1, Math.floor(number)));
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const assigneeMembershipId =
    typeof body.assigneeMembershipId === "string" && body.assigneeMembershipId.trim()
      ? body.assigneeMembershipId.trim()
      : loaded.actor.membershipId;
  if (!canAssign(loaded.world, loaded.actor, assigneeMembershipId)) {
    return jsonError("forbidden", 403);
  }
  const subject = loaded.world.memberships.find((row) => row.id === assigneeMembershipId);
  const context = await assigneeCoachingContext(loaded.actor.orgId, assigneeMembershipId);
  let generated;
  try {
    generated = await generateTasksForAe({
      aeName: context.aeName,
      strengths: context.strengths,
      weaknesses: context.weaknesses,
      skillScores: context.skillScores,
      existingOpenTasks: context.existingOpenTasks,
      count: boundedCount(body.count),
      role: roleFor(subject?.stance || context.stance, subject ? memberHasPlatformAdmin(loaded.world, subject.memberId) : false),
    });
  } catch {
    return jsonError("ai_unavailable", 502);
  }
  try {
    const tasks = await insertGeneratedTasks(loaded.actor, assigneeMembershipId, generated);
    return NextResponse.json({ ok: true, tasks });
  } catch (error) {
    if (error instanceof TaskError) return jsonError(error.code, error.status);
    throw error;
  }
}
