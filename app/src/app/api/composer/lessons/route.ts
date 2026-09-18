import { NextResponse } from "next/server";
import { requireMember, requireTeacher, deny } from "@/lib/composer/access";
import { canTeach, isSourceKind } from "@/lib/composer/rules";
import { createLesson, getLessonDetail, listLessons } from "@/lib/composer/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMember(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  if (id) {
    const detail = await getLessonDetail(auth.identity, id);
    if (!detail) return deny(404, "unknown_lesson");
    const teacher = canTeach(auth.identity);
    return NextResponse.json({
      ok: true,
      org: auth.identity.orgSlug,
      canTeach: teacher,
      lesson: {
        id: detail.lesson.id,
        title: detail.lesson.title,
        body: detail.lesson.body,
        status: detail.lesson.status,
        slug: detail.lesson.slug,
        courseId: detail.course.id,
        courseTitle: detail.course.title,
        kind: detail.course.kind,
      },
      sources: detail.sources.map((source: (typeof detail.sources)[number]) => ({
        id: source.id,
        kind: source.kind,
        title: source.title,
        body: source.body,
        url: source.url,
        bookTitle: source.bookTitle,
        fileName: source.fileName,
        mime: source.mime,
        hasFile: Boolean(source.filePath),
      })),
      units: detail.units.map((unit: (typeof detail.units)[number]) => ({
        id: unit.id,
        sourceId: unit.sourceId,
        title: unit.title,
        body: unit.body,
        sortOrder: unit.sortOrder,
      })),
      quiz: detail.quiz.map((item: (typeof detail.quiz)[number]) => ({
        id: item.id,
        sourceUnitId: item.sourceUnitId,
        prompt: item.prompt,
        choices: item.choices,
        ...(teacher ? { answer: item.answer, why: item.why } : {}),
      })),
    });
  }
  const lessons = await listLessons(auth.identity);
  return NextResponse.json({
    ok: true,
    org: auth.identity.orgSlug,
    canTeach: canTeach(auth.identity),
    lessons,
  });
}

export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const kind = typeof body.kind === "string" ? body.kind : "text";
  if (!isSourceKind(kind)) return deny(400, "invalid_kind");
  const title = typeof body.title === "string" ? body.title : "";
  const text = typeof body.body === "string" ? body.body : "";
  if (!text.trim()) return deny(400, "supplied_text_required");
  const created = await createLesson(auth.identity, {
    title,
    kind,
    body: text,
    url: typeof body.url === "string" ? body.url : "",
    bookTitle: typeof body.book_title === "string" ? body.book_title : "",
  });
  return NextResponse.json({
    ok: true,
    lesson: {
      id: created.lesson.id,
      title: created.lesson.title,
      status: created.lesson.status,
      kind: created.course.kind,
    },
    units: created.units.map((unit: (typeof created.units)[number]) => ({
      id: unit.id,
      title: unit.title,
    })),
  });
}
