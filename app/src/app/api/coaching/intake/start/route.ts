import { and, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { memberHasPlatformAdmin } from "@/lib/coaching/access";
import {
  DIRECTOR_INTAKE_CATEGORIES,
  clientQuestion,
  directorIntakeAllowed,
  intercalate,
} from "@/lib/coaching/intercalate";
import { loadCoachingWorld } from "@/lib/coaching/scores";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { getDb } from "@/lib/db/client";
import { answerSets, answers, questions } from "@/lib/db/schema";

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

  let body: { kind?: unknown } = {};
  try {
    const text = await request.text();
    body = text.trim() ? (JSON.parse(text) as { kind?: unknown }) : {};
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const kind = body.kind === "director_intake" ? "director_intake" : "intake";
  const { identity } = auth;
  if (kind === "director_intake") {
    const world = await loadCoachingWorld(identity);
    const capabilities = world.capabilities
      .filter((row) => row.membershipId === identity.membershipId)
      .map((row) => row.capability);
    if (
      !directorIntakeAllowed({
        stance: identity.stance,
        capabilities,
        platformAdmin: memberHasPlatformAdmin(world, identity.memberId),
      })
    ) {
      return NextResponse.json({ ok: false, error: "director_intake_forbidden" }, { status: 403 });
    }
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(answerSets)
    .where(
      and(
        eq(answerSets.orgId, identity.orgId),
        eq(answerSets.membershipId, identity.membershipId),
        eq(answerSets.kind, kind),
        eq(answerSets.status, "in_progress"),
      ),
    )
    .orderBy(desc(answerSets.createdAt))
    .limit(1);

  let set = existing ?? null;
  if (!set) {
    const bank = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.active, true),
          or(eq(questions.orgId, identity.orgId), isNull(questions.orgId)),
          kind === "director_intake"
            ? inArray(questions.category, [...DIRECTOR_INTAKE_CATEGORIES])
            : ne(questions.category, "DIRECTOR_MONTHLY_REVIEW"),
        ),
      );
    const ordered = intercalate(
      bank.map((row) => ({
        id: row.id,
        category: row.category,
        productId: row.productId,
      })),
    );
    const [last] = await db
      .select({ version: answerSets.version })
      .from(answerSets)
      .where(
        and(
          eq(answerSets.orgId, identity.orgId),
          eq(answerSets.membershipId, identity.membershipId),
          eq(answerSets.kind, kind),
        ),
      )
      .orderBy(desc(answerSets.version))
      .limit(1);
    const [created] = await db
      .insert(answerSets)
      .values({
        orgId: identity.orgId,
        membershipId: identity.membershipId,
        subjectMembershipId: identity.membershipId,
        kind,
        status: "in_progress",
        version: (last?.version ?? 0) + 1,
        resumeIndex: 0,
        questionOrder: ordered.map((row) => row.id),
      })
      .returning();
    set = created ?? null;
  }
  if (!set) {
    return NextResponse.json({ ok: false, error: "intake_unavailable" }, { status: 500 });
  }

  const order = orderOf(set.questionOrder);
  const rows = order.length
    ? await db.select().from(questions).where(inArray(questions.id, order))
    : [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const prior = await db.select().from(answers).where(eq(answers.answerSetId, set.id));
  const saved: Record<string, unknown> = {};
  for (const row of prior) saved[row.questionId] = row.value;

  return NextResponse.json({
    ok: true,
    answerSetId: set.id,
    kind: set.kind,
    resumeIndex: set.resumeIndex,
    questions: order.flatMap((id) => {
      const row = byId.get(id);
      if (!row) return [];
      return [
        clientQuestion({
          id: row.id,
          questionType: row.questionType,
          text: row.text,
          options: row.options,
        }),
      ];
    }),
    answers: saved,
  });
}
