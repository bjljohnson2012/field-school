import { NextResponse } from "next/server";
import { readJson, refuse, signedIn, unavailable } from "@/lib/assessments/actor";
import { parseAnswer, wizardRefusal } from "@/lib/assessments/model";
import { answerRun, readRun } from "@/lib/assessments/store";
import { isUuid } from "@/lib/enrichment/model";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ runId: string }> };

const STATUS = { run_not_found: 404, run_finished: 409, answer_not_expected: 409 } as const;

export async function POST(request: Request, ctx: Params) {
  try {
    const auth = await signedIn(request);
    if (!auth.ok) return auth.response;
    const { runId } = await ctx.params;
    if (!isUuid(runId)) return refuse(404, "run_not_found");
    const json = await readJson(request);
    if (!json.ok) return refuse(400, "invalid_json");
    const answer = parseAnswer(json.body);
    if (!answer) return refuse(400, "answer_invalid");
    const current = await readRun(auth.actor.owner, runId);
    if (!current) return refuse(404, "run_not_found");
    const refusal = wizardRefusal(auth.actor, current.track);
    if (refusal) return refuse(403, refusal);
    const result = await answerRun(auth.actor.owner, runId, answer);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, run: result.view ?? null }, { status: STATUS[result.error] });
    }
    return NextResponse.json({ ok: true, run: result.view });
  } catch (error) {
    return unavailable(error);
  }
}
