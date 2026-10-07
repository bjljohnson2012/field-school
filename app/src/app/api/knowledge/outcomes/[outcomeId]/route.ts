import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { clampRequirements, type RequirementDraft } from "@/lib/gap-loop/score";
import { confirmOutcome, editOutcome, getWorkspace, setRunControl } from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ outcomeId: string }> };

function runner(request: Request) {
  return request.headers.get("x-runner-id")?.trim() || crypto.randomUUID();
}

function requirementsOf(value: unknown) {
  if (!Array.isArray(value)) return null;
  const rows: RequirementDraft[] = value.map((item) => {
    const row = item as { label?: unknown; kind?: unknown; weight?: unknown; doneCondition?: { evidenceType?: unknown; text?: unknown } };
    const kind = row.kind === "skill" || row.kind === "demonstration" ? row.kind : "knowledge";
    return {
      label: typeof row.label === "string" ? row.label : "",
      kind,
      weight: typeof row.weight === "number" ? row.weight : 1,
      doneCondition: {
        evidenceType: typeof row.doneCondition?.evidenceType === "string" ? row.doneCondition.evidenceType : "upload",
        text: typeof row.doneCondition?.text === "string" ? row.doneCondition.text : "",
      },
    };
  });
  return clampRequirements(rows);
}

export async function GET(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { outcomeId } = await params;
    if (!isUuid(outcomeId)) return NextResponse.json({ ok: false, error: "unknown_outcome" }, { status: 404 });
    const workspace = await getWorkspace(gate.actor, gate.staff, outcomeId);
    return NextResponse.json({ ok: true, ...workspace });
  } catch (error) {
    return gapError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { outcomeId } = await params;
    if (!isUuid(outcomeId)) return NextResponse.json({ ok: false, error: "unknown_outcome" }, { status: 404 });
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    const action = typeof body.action === "string" ? body.action : "edit";
    const who = runner(request);
    if (action === "confirm") {
      const workspace = await confirmOutcome(gate.actor, gate.staff, outcomeId, who, requirementsOf(body.requirements));
      return NextResponse.json({ ok: true, ...workspace });
    }
    if (action === "pause" || action === "resume" || action === "archive") {
      const workspace = await setRunControl(gate.actor, gate.staff, outcomeId, who, action);
      return NextResponse.json({ ok: true, ...workspace });
    }
    const workspace = await editOutcome(gate.actor, gate.staff, outcomeId, who, {
      title: typeof body.title === "string" ? body.title : undefined,
      statement: typeof body.statement === "string" ? body.statement : undefined,
      horizon: typeof body.horizon === "string" ? body.horizon : undefined,
    });
    return NextResponse.json({ ok: true, ...workspace });
  } catch (error) {
    return gapError(error);
  }
}
