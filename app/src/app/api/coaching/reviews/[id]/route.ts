import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { isResponse, jsonError, loadTaskActor, readJson } from "../../tasks/session";
import { loadReviewDetail, openReview, saveReviewAnswers } from "../load";
import { ReviewFlowError } from "../submit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError("not_found", 404);
  try {
    const detail = await loadReviewDetail(loaded.world, loaded.actor, id);
    return NextResponse.json({ ok: true, ...detail });
  } catch (error) {
    if (error instanceof ReviewFlowError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError("not_found", 404);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  try {
    if (Array.isArray(body.answers)) {
      const answers = body.answers.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const questionId = "questionId" in item && typeof item.questionId === "string" ? item.questionId : "";
        if (!UUID.test(questionId)) return [];
        return [{ questionId, value: "value" in item ? item.value : "" }];
      });
      const detail = await saveReviewAnswers(loaded.world, loaded.actor, id, answers);
      return NextResponse.json({ ok: true, ...detail });
    }
    const detail = await openReview(loaded.world, loaded.actor, id);
    return NextResponse.json({ ok: true, ...detail });
  } catch (error) {
    if (error instanceof ReviewFlowError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
