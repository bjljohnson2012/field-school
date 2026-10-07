import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { actForRun } from "@/lib/gap-loop/advance";
import { awaitingResponse, getWorkspace, stepStore } from "@/lib/gap-loop/store";
import { runStep } from "@/lib/gap-loop/step";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ outcomeId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { outcomeId } = await params;
    if (!isUuid(outcomeId)) return NextResponse.json({ ok: false, error: "unknown_outcome" }, { status: 404 });
    const key = request.headers.get("idempotency-key")?.trim() || "";
    if (!key) return NextResponse.json({ ok: false, error: "idempotency_key_required" }, { status: 400 });
    const workspace = await getWorkspace(gate.actor, gate.staff, outcomeId);
    if (workspace.run.state === "waiting_on_user") {
      const response = await awaitingResponse(outcomeId);
      if (!response || response.integrated) {
        return NextResponse.json({ ok: false, error: "needs_response" }, { status: 409 });
      }
    }
    const result = await runStep(stepStore, {
      runId: workspace.run.id,
      idempotencyKey: key,
      runnerId: request.headers.get("x-runner-id")?.trim() || crypto.randomUUID(),
      act: actForRun,
    });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    const next = await getWorkspace(gate.actor, gate.staff, outcomeId);
    return NextResponse.json({ ok: true, replay: result.replay, summary: result.summary, hold: result.hold, ...next });
  } catch (error) {
    return gapError(error);
  }
}
