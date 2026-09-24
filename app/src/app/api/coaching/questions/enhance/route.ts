import { NextResponse } from "next/server";
import { enhanceMcOption } from "@/lib/ai/prompts/questions";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { enhanceGoal, questionOptions, questionTags } from "../access";
import { QuestionError, loadMutableQuestion, saveEnhancedOption } from "../persist";
import { isResponse, jsonError, loadQuestionActor, readJson } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadQuestionActor(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const questionId = typeof body.questionId === "string" ? body.questionId.trim() : "";
  const optionIndex = typeof body.optionIndex === "number" ? body.optionIndex : Number(body.optionIndex);
  if (!questionId || !Number.isInteger(optionIndex) || optionIndex < 0) return jsonError("invalid_body", 400);

  let current;
  try {
    const row = await loadMutableQuestion(loaded.actor, questionId);
    const options = questionOptions(row.options);
    current = options?.[optionIndex];
    if (row.questionType !== "MULTIPLE_CHOICE" || !current) return jsonError("invalid_body", 400);
    const enhanced = await enhanceMcOption({
      questionText: row.text,
      questionCategory: row.category,
      current,
      goal: enhanceGoal(body.goal),
    });
    const question = await saveEnhancedOption(loaded.actor, questionId, optionIndex, {
      label: typeof enhanced.label === "string" ? enhanced.label : current.label,
      tags: questionTags(enhanced.tags),
    });
    return NextResponse.json({ ok: true, question });
  } catch (error) {
    if (error instanceof QuestionError) return jsonError(error.code, error.status);
    if (error instanceof Error && /xai_|Grok/.test(error.message)) return jsonError("ai_unavailable", 502);
    throw error;
  }
}
