import { NextResponse } from "next/server";
import { generateSmartBulkQuestions } from "@/lib/ai/prompts/questions";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { allowedQuestionTypes, boundedCount, isQuestionCategory, orgIdForCreate, questionTags } from "../access";
import { QuestionError, existingForCategory, insertGenerated, orgAiContext } from "../persist";
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

  const orgId = orgIdForCreate(loaded.actor, body.scope);
  if (orgId === "forbidden") return jsonError("forbidden", 403);
  const category = typeof body.category === "string" ? body.category : "";
  const count = boundedCount(body.count);
  if (!isQuestionCategory(category) || !count) return jsonError("invalid_body", 400);
  const productId = typeof body.productId === "string" && body.productId.trim() ? body.productId.trim() : null;
  const org = await orgAiContext(loaded.actor.orgId);
  const rawContext = body.context;
  const given =
    rawContext && typeof rawContext === "object" && !Array.isArray(rawContext)
      ? (rawContext as Record<string, unknown>)
      : {};

  let result;
  try {
    result = await generateSmartBulkQuestions(
      {
        category,
        existingQuestions: await existingForCategory(loaded.actor, category),
        count,
        coverageTargets: questionTags(body.coverageTargets),
        styleHint: typeof body.styleHint === "string" ? body.styleHint : undefined,
        context: {
          productName: typeof given.productName === "string" ? given.productName : undefined,
          salesMethodology:
            typeof given.salesMethodology === "string" ? given.salesMethodology : org.salesMethodology,
          companyValues: "companyValues" in given ? questionTags(given.companyValues) : org.companyValues,
        },
        allowedTypes: allowedQuestionTypes(body.allowedTypes),
      },
      org.aiModel,
    );
  } catch {
    return jsonError("ai_unavailable", 502);
  }

  try {
    const created = await insertGenerated(loaded.actor, orgId, productId, category, result.questions ?? []);
    return NextResponse.json({ ok: true, analysis: result.analysis ?? null, questions: created });
  } catch (error) {
    if (error instanceof QuestionError) return jsonError(error.code, error.status);
    throw error;
  }
}
