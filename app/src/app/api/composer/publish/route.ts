import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { publishLesson } from "@/lib/composer/store";

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
  const lessonId = typeof body.lesson_id === "string" ? body.lesson_id : "";
  const result = await publishLesson(auth.identity, lessonId);
  if ("error" in result) return deny(404, result.error ?? "unknown_lesson");
  return NextResponse.json({
    ok: true,
    lesson: { id: result.lesson.id, status: result.lesson.status },
    request: { id: result.request.id, status: result.request.status },
  });
}
