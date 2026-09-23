import { NextResponse } from "next/server";
import { assertCanAccessMember, type Actor } from "@/lib/coaching/access";
import {
  applySkillScore,
  canCoachOverride,
  loadCoachingWorld,
  loadSubjectIdentity,
  SkillScoreError,
} from "@/lib/coaching/scores";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { identityFromRequest } from "@/lib/campus-runtime/identity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { membershipId?: unknown; skillSlug?: unknown; score?: unknown; notes?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const membershipId = typeof body.membershipId === "string" ? body.membershipId.trim() : "";
  const skillSlug = typeof body.skillSlug === "string" ? body.skillSlug.trim() : "";
  const score = typeof body.score === "number" ? body.score : Number.NaN;
  if (!membershipId || !skillSlug || !Number.isFinite(score)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const subject = await loadSubjectIdentity(membershipId);
  if (!subject) {
    return NextResponse.json({ ok: false, error: "unknown_member" }, { status: 404 });
  }

  const actor: Actor = {
    memberId: auth.identity.memberId,
    membershipId: auth.identity.membershipId,
    orgId: auth.identity.orgId,
    stance: auth.identity.stance,
  };
  const world = await loadCoachingWorld(actor);
  if (!assertCanAccessMember(world, actor, subject.membershipId) || !canCoachOverride(world, actor)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    await applySkillScore({
      actor: auth.identity,
      subject,
      skillSlug,
      score,
      source: "coach_override",
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
  } catch (error) {
    if (error instanceof SkillScoreError) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
