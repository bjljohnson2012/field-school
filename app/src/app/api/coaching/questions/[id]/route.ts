import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isQuestionCategory, isQuestionType, questionOptions, questionTags, weightOf } from "../access";
import { QuestionError, deleteQuestion, updateQuestion, type QuestionPatch } from "../persist";
import { isResponse, jsonError, loadQuestionActor, readJson } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadQuestionActor(request);
  if (!loaded.ok) return loaded.response;
  const { id } = await context.params;
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const patch: QuestionPatch = {};
  if (typeof body.category === "string") {
    if (!isQuestionCategory(body.category)) return jsonError("invalid_body", 400);
    patch.category = body.category;
  }
  if (typeof body.questionType === "string") {
    if (!isQuestionType(body.questionType)) return jsonError("invalid_body", 400);
    patch.questionType = body.questionType;
  }
  if (typeof body.text === "string") patch.text = body.text;
  if ("options" in body) patch.options = questionOptions(body.options);
  if ("tags" in body) patch.tags = questionTags(body.tags);
  if ("weight" in body) patch.weight = weightOf(body.weight);
  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.productId === null) patch.productId = null;
  if (typeof body.productId === "string") patch.productId = body.productId.trim() || null;

  try {
    const question = await updateQuestion(loaded.actor, id, patch);
    return NextResponse.json({ ok: true, question });
  } catch (error) {
    if (error instanceof QuestionError) return jsonError(error.code, error.status);
    throw error;
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadQuestionActor(request);
  if (!loaded.ok) return loaded.response;
  const { id } = await context.params;
  try {
    await deleteQuestion(loaded.actor, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof QuestionError) return jsonError(error.code, error.status);
    throw error;
  }
}
