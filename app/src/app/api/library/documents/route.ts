import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { updateKnowledgeUnit, updateLessonCopy } from "@/lib/composer/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
  const title = typeof body.title === "string" ? body.title : undefined;
  const text = typeof body.body === "string" ? body.body : undefined;
  const status = body.status === "published" || body.status === "draft" ? body.status : undefined;
  if (lessonId) {
    const saved = await updateLessonCopy(auth.identity, { lessonId, title, body: text, status });
    if ("error" in saved) return deny(404, typeof saved.error === "string" ? saved.error : "unknown_lesson");
  }
  const units = Array.isArray(body.units) ? body.units : [];
  for (const item of units.slice(0, 40)) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; title?: unknown; body?: unknown };
    const unitId = typeof row.id === "string" ? row.id.trim() : "";
    const unitTitle = typeof row.title === "string" ? row.title : "";
    const unitBody = typeof row.body === "string" ? row.body : "";
    if (!unitId) continue;
    const saved = await updateKnowledgeUnit(auth.identity, { unitId, title: unitTitle, body: unitBody });
    if ("error" in saved) return deny(400, typeof saved.error === "string" ? saved.error : "needs_more");
  }
  if (!lessonId && !units.length) return deny(400, "unknown_lesson");
  return NextResponse.json({ ok: true });
}
