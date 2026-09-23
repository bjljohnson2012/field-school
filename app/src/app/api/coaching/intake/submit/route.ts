import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { getDb } from "@/lib/db/client";
import { answerSets, coachingProfiles } from "@/lib/db/schema";
import { enqueueIntakeSynthesis } from "../job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { answerSetId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const answerSetId = typeof body.answerSetId === "string" ? body.answerSetId.trim() : "";
  if (!answerSetId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const db = getDb();
  const [set] = await db.select().from(answerSets).where(eq(answerSets.id, answerSetId)).limit(1);
  if (!set || set.orgId !== auth.identity.orgId) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (set.membershipId !== auth.identity.membershipId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (set.kind !== "intake" && set.kind !== "director_intake") {
    return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 400 });
  }

  const [profile] = await db
    .select()
    .from(coachingProfiles)
    .where(
      and(
        eq(coachingProfiles.orgId, set.orgId),
        eq(coachingProfiles.membershipId, set.membershipId),
      ),
    )
    .limit(1);
  if (profile?.synthesisStatus === "generating") {
    return NextResponse.json({ ok: true, synthesis_status: "generating" });
  }

  const startedAt = new Date();
  await db.transaction(async (tx) => {
    await tx.update(answerSets).set({ status: "completed" }).where(eq(answerSets.id, set.id));
    await tx
      .insert(coachingProfiles)
      .values({
        orgId: set.orgId,
        membershipId: set.membershipId,
        synthesisStatus: "generating",
        synthesisError: null,
        synthesisStartedAt: startedAt,
      })
      .onConflictDoUpdate({
        target: [coachingProfiles.orgId, coachingProfiles.membershipId],
        set: {
          synthesisStatus: "generating",
          synthesisError: null,
          synthesisStartedAt: startedAt,
          updatedAt: startedAt,
        },
      });
  });

  enqueueIntakeSynthesis(set.id);
  return NextResponse.json({ ok: true, synthesis_status: "generating" });
}
