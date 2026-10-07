import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { generateLessonFromKnowledge } from "@/lib/library/submit-knowledge";

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
  const lessonId = typeof body.lesson_id === "string" ? body.lesson_id.trim() : "";
  if (!lessonId) return deny(400, "unknown_lesson");
  const result = await generateLessonFromKnowledge(auth.identity, lessonId);
  if ("error" in result && typeof result.error === "string") {
    const status = result.error === "unknown_lesson" || result.error === "unknown_unit" ? 404 : 400;
    return deny(status, result.error);
  }
  return NextResponse.json(result);
}
