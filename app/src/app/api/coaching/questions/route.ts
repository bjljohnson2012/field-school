import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import {
  isQuestionCategory,
  isQuestionType,
  orgIdForCreate,
  questionOptions,
  questionTags,
  weightOf,
} from "./access";
import { QuestionError, insertQuestion, listQuestions, type QuestionDraft } from "./persist";
import { isResponse, jsonError, loadQuestionActor, readJson } from "./session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const loaded = await loadQuestionActor(request);
  if (!loaded.ok) return loaded.response;
  const bank = await listQuestions(loaded.actor);
  return NextResponse.json({
    ok: true,
    platformAdmin: loaded.actor.platformAdmin,
    questions: bank,
  });
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadQuestionActor(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const orgId = orgIdForCreate(loaded.actor, body.scope);
  if (orgId === "forbidden") return jsonError("forbidden", 403);
  const category = typeof body.category === "string" ? body.category : "";
  const questionType = typeof body.questionType === "string" ? body.questionType : "";
  const text = typeof body.text === "string" ? body.text : "";
  if (!isQuestionCategory(category) || !isQuestionType(questionType) || !text.trim()) {
    return jsonError("invalid_body", 400);
  }
  const draft: QuestionDraft = {
    orgId,
    productId: typeof body.productId === "string" && body.productId.trim() ? body.productId.trim() : null,
    category,
    questionType,
    text,
    options: questionOptions(body.options),
    tags: questionTags(body.tags),
    weight: weightOf(body.weight),
    active: body.active !== false,
  };
  try {
    const question = await insertQuestion(loaded.actor, draft);
    return NextResponse.json({ ok: true, question });
  } catch (error) {
    if (error instanceof QuestionError) return jsonError(error.code, error.status);
    throw error;
  }
}
