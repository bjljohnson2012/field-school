import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { addQuizItem } from "@/lib/composer/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const choices = Array.isArray(body.choices)
    ? body.choices.filter((item): item is string => typeof item === "string")
    : [];
  const result = await addQuizItem(auth.identity, {
    lessonId: typeof body.lesson_id === "string" ? body.lesson_id : "",
    sourceUnitId: typeof body.source_unit_id === "string" ? body.source_unit_id : undefined,
    prompt: typeof body.prompt === "string" ? body.prompt : "",
    choices,
    answer: typeof body.answer === "number" ? body.answer : 0,
    why: typeof body.why === "string" ? body.why : "",
  });
  if ("error" in result) {
    const status =
      result.error === "source_unit_id_required"
        ? 400
        : result.error === "unknown_lesson" || result.error === "unknown_unit"
          ? 404
          : 400;
    return deny(status, result.error ?? "invalid_quiz");
  }
  return NextResponse.json({
    ok: true,
    item: {
      id: result.item.id,
      sourceUnitId: result.item.sourceUnitId,
      prompt: result.item.prompt,
    },
  });
}
