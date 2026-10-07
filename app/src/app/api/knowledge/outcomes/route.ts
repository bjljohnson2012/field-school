import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { GapFieldsError } from "@/lib/gap-loop/errors";
import { createOutcome, listOutcomes } from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const listed = await listOutcomes(gate.actor, gate.staff);
    return NextResponse.json({ ok: true, outcomes: listed.outcomes, childGoals: listed.childGoals });
  } catch (error) {
    return gapError(error);
  }
}

export async function POST(request: Request) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    const childMembershipId = typeof body.childMembershipId === "string" ? body.childMembershipId : "";
    if (body.ownerKind === "child" && !isUuid(childMembershipId)) throw new GapFieldsError("child_membership_id_required");
    const outcome = await createOutcome(gate.actor, gate.staff, {
      ownerKind: body.ownerKind === "child" ? "child" : "person",
      statement: typeof body.statement === "string" ? body.statement : "",
      title: typeof body.title === "string" ? body.title : "",
      horizon: typeof body.horizon === "string" ? body.horizon : "",
      childMembershipId,
    });
    return NextResponse.json({ ok: true, outcome });
  } catch (error) {
    return gapError(error);
  }
}
