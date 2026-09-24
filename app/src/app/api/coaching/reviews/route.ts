import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { isResponse, jsonError, loadTaskActor, readJson } from "../tasks/session";
import { createPendingReview, listPendingReviews, reviewQuestions, subjectChoices } from "./load";
import { ReviewFlowError } from "./submit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const subject = new URL(request.url).searchParams.get("subject")?.trim() ?? "";
  if (subject && !UUID.test(subject)) return jsonError("invalid_body", 400);
  try {
    const reviews = await listPendingReviews(loaded.world, loaded.actor, subject || undefined);
    const questions = await reviewQuestions(loaded.actor.orgId);
    const subjects = await subjectChoices(loaded.world, loaded.actor);
    return NextResponse.json({ ok: true, reviews, questions, subjects });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const subjectMembershipId = typeof body.subjectMembershipId === "string" ? body.subjectMembershipId.trim() : "";
  if (!UUID.test(subjectMembershipId)) return jsonError("invalid_body", 400);
  try {
    const review = await createPendingReview(loaded.world, loaded.actor, subjectMembershipId, body.monthOf);
    return NextResponse.json({ ok: true, review: { id: review.id, status: review.status } });
  } catch (error) {
    if (error instanceof ReviewFlowError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
