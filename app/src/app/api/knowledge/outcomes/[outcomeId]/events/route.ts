import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { eventsAfter } from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ outcomeId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { outcomeId } = await params;
    if (!isUuid(outcomeId)) return NextResponse.json({ ok: false, error: "unknown_outcome" }, { status: 404 });
    const seq = Number(new URL(request.url).searchParams.get("seq") || "0");
    const events = await eventsAfter(gate.actor, gate.staff, outcomeId, Number.isFinite(seq) ? seq : 0);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return gapError(error);
  }
}
