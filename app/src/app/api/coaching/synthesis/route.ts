import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { assertCanAccessMember, type Actor } from "@/lib/coaching/access";
import { synthesisIsStale } from "@/lib/coaching/intercalate";
import { loadCoachingWorld } from "@/lib/coaching/scores";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { getDb } from "@/lib/db/client";
import { answerSets, coachingProfiles } from "@/lib/db/schema";
import { enqueueIntakeSynthesis } from "../intake/job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stamp(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get("membershipId")?.trim() || auth.identity.membershipId;
  if (requested !== auth.identity.membershipId) {
    const world = await loadCoachingWorld(auth.identity);
    const actor: Actor = {
      memberId: auth.identity.memberId,
      membershipId: auth.identity.membershipId,
      orgId: auth.identity.orgId,
      stance: auth.identity.stance,
    };
    if (!assertCanAccessMember(world, actor, requested)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(coachingProfiles)
    .where(
      and(eq(coachingProfiles.orgId, auth.identity.orgId), eq(coachingProfiles.membershipId, requested)),
    )
    .limit(1);

  let startedAt = profile?.synthesisStartedAt ?? null;
  if (
    profile &&
    synthesisIsStale(profile.synthesisStatus, profile.synthesisStartedAt) &&
    !requireCoachingWrite()
  ) {
    const claimed = await db
      .update(coachingProfiles)
      .set({
        synthesisStartedAt: new Date(),
        synthesisError: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coachingProfiles.id, profile.id),
          eq(coachingProfiles.synthesisStatus, "generating"),
          or(
            isNull(coachingProfiles.synthesisStartedAt),
            sql`${coachingProfiles.synthesisStartedAt} < now() - interval '3 minutes'`,
          ),
        ),
      )
      .returning({ id: coachingProfiles.id, synthesisStartedAt: coachingProfiles.synthesisStartedAt });
    const claim = claimed[0];
    if (claim) {
      startedAt = claim.synthesisStartedAt;
      const [set] = await db
        .select({ id: answerSets.id })
        .from(answerSets)
        .where(
          and(
            eq(answerSets.orgId, profile.orgId),
            eq(answerSets.membershipId, profile.membershipId),
            eq(answerSets.status, "completed"),
            inArray(answerSets.kind, ["intake", "director_intake"]),
          ),
        )
        .orderBy(desc(answerSets.createdAt))
        .limit(1);
      if (set) enqueueIntakeSynthesis(set.id);
    }
  }

  return NextResponse.json({
    ok: true,
    synthesis_status: profile?.synthesisStatus ?? "idle",
    synthesis_error: profile?.synthesisError ?? null,
    synthesis_started_at: stamp(startedAt),
    last_synthesized_at: stamp(profile?.lastSynthesizedAt),
  });
}
