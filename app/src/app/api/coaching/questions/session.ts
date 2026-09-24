import { NextResponse } from "next/server";
import { identityFromRequest, type LearnerIdentity } from "@/lib/campus-runtime/identity";
import { memberHasPlatformAdmin } from "@/lib/coaching/access";
import { loadCoachingWorld } from "@/lib/coaching/scores";
import { canAuthorQuestions, type QuestionAuthor } from "./access";

export function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

export async function readJson(request: Request) {
  try {
    const text = await request.text();
    if (!text.trim()) return {} as Record<string, unknown>;
    const body = JSON.parse(text) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("invalid_json", 400);
    return body as Record<string, unknown>;
  } catch {
    return jsonError("invalid_json", 400);
  }
}

export async function authorFromIdentity(identity: LearnerIdentity) {
  const world = await loadCoachingWorld(identity);
  const capabilities = world.capabilities
    .filter((row) => row.membershipId === identity.membershipId)
    .map((row) => row.capability);
  if (identity.stance === "leader" && !capabilities.includes("leader")) capabilities.push("leader");
  const actor: QuestionAuthor = {
    platformAdmin: memberHasPlatformAdmin(world, identity.memberId),
    capabilities,
    orgId: identity.orgId,
    membershipId: identity.membershipId,
  };
  if (!canAuthorQuestions(actor)) return { ok: false as const, response: jsonError("forbidden", 403) };
  return { ok: true as const, actor };
}

export async function loadQuestionActor(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: jsonError(auth.error, auth.status) };
  return authorFromIdentity(auth.identity);
}
