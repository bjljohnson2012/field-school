import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai/prompts/questions";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import {
  allowedQuestionTypes,
  isQuestionCategory,
  orgIdForCreate,
  questionTags,
  boundedCount,
} from "../access";
import { QuestionError, insertGenerated, orgAiContext } from "../persist";
import { isResponse, jsonError, loadQuestionActor, readJson } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function contextFrom(body: Record<string, unknown>, org: Awaited<ReturnType<typeof orgAiContext>>) {
  const raw = body.context;
  const given = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const companyValues = "companyValues" in given ? questionTags(given.companyValues) : org.companyValues;
  return {
    productName: typeof given.productName === "string" ? given.productName : undefined,
    productSummary: typeof given.productSummary === "string" ? given.productSummary : undefined,
    salesMethodology:
      typeof given.salesMethodology === "string" ? given.salesMethodology : org.salesMethodology,
    companyValues,
  };
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
  const count = boundedCount(body.count);
  if (!isQuestionCategory(category) || !count) return jsonError("invalid_body", 400);
  const productId = typeof body.productId === "string" && body.productId.trim() ? body.productId.trim() : null;
  const org = await orgAiContext(loaded.actor.orgId);

  let generated;
  try {
    generated = await generateQuestions(
      {
        category,
        count,
        context: contextFrom(body, org),
        avoidTexts: questionTags(body.avoidTexts),
        allowedTypes: allowedQuestionTypes(body.allowedTypes),
      },
      org.aiModel,
    );
  } catch {
    return jsonError("ai_unavailable", 502);
  }

  try {
    const created = await insertGenerated(loaded.actor, orgId, productId, category, generated);
    return NextResponse.json({ ok: true, questions: created });
  } catch (error) {
    if (error instanceof QuestionError) return jsonError(error.code, error.status);
    throw error;
  }
}
