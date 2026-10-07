import { NextResponse } from "next/server";
import { refuse, signedIn, unavailable } from "@/lib/assessments/actor";
import { wizardRefusal } from "@/lib/assessments/model";
import { readRun } from "@/lib/assessments/store";
import { isUuid } from "@/lib/enrichment/model";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ runId: string }> };

export async function GET(request: Request, ctx: Params) {
  try {
    const auth = await signedIn(request);
    if (!auth.ok) return auth.response;
    const { runId } = await ctx.params;
    if (!isUuid(runId)) return refuse(404, "run_not_found");
    const run = await readRun(auth.actor.owner, runId);
    if (!run) return refuse(404, "run_not_found");
    const refusal = wizardRefusal(auth.actor, run.track);
    if (refusal) return refuse(403, refusal);
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    return unavailable(error);
  }
}
