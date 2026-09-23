import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { advanceResumeIndex } from "@/lib/coaching/intercalate";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { getDb } from "@/lib/db/client";
import { answerSets, answers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function orderOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { answerSetId?: unknown; questionId?: unknown; value?: unknown; resumeIndex?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const answerSetId = typeof body.answerSetId === "string" ? body.answerSetId.trim() : "";
  const questionId = typeof body.questionId === "string" ? body.questionId.trim() : "";
  if (!answerSetId || !questionId || body.value === undefined) {
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
  if (set.status !== "in_progress") {
    return NextResponse.json({ ok: false, error: "intake_closed" }, { status: 409 });
  }

  const order = orderOf(set.questionOrder);
  const at = order.indexOf(questionId);
  if (at < 0) {
    return NextResponse.json({ ok: false, error: "unknown_question" }, { status: 400 });
  }
  const requested = Number.isInteger(body.resumeIndex) ? Number(body.resumeIndex) : at + 1;
  const resumeIndex = advanceResumeIndex(set.resumeIndex, requested, order.length);

  await db.transaction(async (tx) => {
    await tx
      .insert(answers)
      .values({
        orgId: set.orgId,
        answerSetId: set.id,
        questionId,
        value: body.value,
      })
      .onConflictDoUpdate({
        target: [answers.answerSetId, answers.questionId],
        set: { value: body.value, updatedAt: new Date() },
      });
    await tx
      .update(answerSets)
      .set({ resumeIndex })
      .where(and(eq(answerSets.id, set.id), eq(answerSets.membershipId, auth.identity.membershipId)));
  });

  return NextResponse.json({ ok: true, resumeIndex });
}
