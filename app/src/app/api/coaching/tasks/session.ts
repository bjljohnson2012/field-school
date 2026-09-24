import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import type { Actor } from "@/lib/coaching/access";
import { loadCoachingWorld } from "@/lib/coaching/scores";

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

export async function loadTaskActor(request?: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, status: auth.status, error: auth.error };
  try {
    const world = await loadCoachingWorld(auth.identity);
    const actor: Actor = {
      memberId: auth.identity.memberId,
      membershipId: auth.identity.membershipId,
      orgId: auth.identity.orgId,
      stance: auth.identity.stance,
    };
    return { ok: true as const, actor, world, name: auth.identity.name };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false as const, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}
