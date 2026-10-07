import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { freshKeyForGap, rescoreOwned } from "@/lib/gap-loop/advance";
import { GapFieldsError } from "@/lib/gap-loop/errors";
import { getWorkspace, patchGap } from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ gapId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { gapId } = await params;
    if (!isUuid(gapId)) return NextResponse.json({ ok: false, error: "unknown_gap" }, { status: 404 });
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    const action = body.action === "reject" || body.action === "waive" || body.action === "reopen" ? body.action : "";
    if (!action) throw new GapFieldsError("gap_action_required");
    const reason = typeof body.reason === "string" ? body.reason.replace(/\s+/g, " ").trim().slice(0, 240) : "";
    const freshKey = action === "reopen" ? await freshKeyForGap(gapId) : "";
    const outcomeId = await patchGap(
      gate.actor,
      gate.staff,
      gapId,
      request.headers.get("x-runner-id")?.trim() || crypto.randomUUID(),
      action,
      reason,
      freshKey,
    );
    await rescoreOwned(outcomeId);
    const workspace = await getWorkspace(gate.actor, gate.staff, outcomeId);
    return NextResponse.json({ ok: true, ...workspace });
  } catch (error) {
    return gapError(error);
  }
}
