import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { GapAccessError, GapFieldsError } from "@/lib/gap-loop/errors";
import { decideApproval } from "@/lib/gap-loop/research";
import { outcomeWrite, parseOutcomeScope } from "@/lib/gap-loop/rules";
import { runStep } from "@/lib/gap-loop/step";
import {
  cell,
  childNames,
  getWorkspace,
  loadBundle,
  loadRun,
  logSameStateEvent,
  setTaskStatus,
  stepStore,
  taskResponse,
} from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ taskId: string }> };

function runner(request: Request) {
  return request.headers.get("x-runner-id")?.trim() || crypto.randomUUID();
}

export async function POST(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { taskId } = await params;
    if (!isUuid(taskId)) return NextResponse.json({ ok: false, error: "unknown_task" }, { status: 404 });
    const body = (await request.json().catch(() => null)) as { queryText?: unknown } | null;
    if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    const row = await taskResponse(taskId, gate.actor);
    if (!row) throw new GapAccessError(404, "unknown_task");
    const ownerKind = parseOutcomeScope(cell(row, "owner_kind"));
    const allowed = outcomeWrite(gate.actor, ownerKind, gate.staff);
    if (!allowed.ok) throw new GapAccessError(403, allowed.error);
    if (!gate.staff && cell(row, "owner_membership_id") !== gate.actor.membershipId) throw new GapAccessError(403, "forbidden");
    if (cell(row, "channel") !== "web") throw new GapFieldsError("web_needs_approval");
    if (cell(row, "status") !== "awaiting_user" && cell(row, "status") !== "approved") throw new GapFieldsError("task_closed");
    const names =
      ownerKind === "child" && cell(row, "child_membership_id")
        ? await childNames(cell(row, "org_id"), cell(row, "child_membership_id"))
        : { name: "", identifiers: [] as string[] };
    const identifiers = ownerKind === "child" ? [names.name, ...names.identifiers].filter(Boolean) : [];
    const decision = decideApproval({
      storedQuery: cell(row, "query_text"),
      submittedQuery: typeof body.queryText === "string" ? body.queryText : "",
      identifiers,
    });
    const bundle = await loadBundle(cell(row, "outcome_id"));
    if (!bundle) throw new GapAccessError(404, "unknown_outcome");
    const runId = cell(bundle.run, "id");
    if (!decision.ok) {
      if ("event" in decision && decision.event) await logSameStateEvent(runId, decision.event.kind, decision.event.summary);
      throw new GapFieldsError(decision.error === "declined" ? "query_mismatch" : decision.error);
    }
    if (cell(row, "status") === "awaiting_user") await setTaskStatus(taskId, "approved", gate.actor.membershipId);
    const fresh = await loadRun(runId);
    if (fresh && fresh.state === "waiting_on_user") {
      const stepped = await runStep(stepStore, {
        runId,
        idempotencyKey: `${runId}:${fresh.cycle}:${fresh.state}`,
        runnerId: runner(request),
        act: async () => ({ event: "approve", detail: { taskId } }),
      });
      if (!stepped.ok && stepped.error !== "lease_held") throw new GapFieldsError(stepped.error);
    }
    const workspace = await getWorkspace(gate.actor, gate.staff, cell(row, "outcome_id"));
    return NextResponse.json({ ok: true, ...workspace });
  } catch (error) {
    return gapError(error);
  }
}
