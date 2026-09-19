import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { addSource } from "@/lib/composer/store";

export const dynamic = "force-dynamic";

async function readFilePart(file: File | null) {
  if (!file) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { name: file.name, type: file.type, bytes };
}

export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  const contentType = request.headers.get("content-type") || "";
  let lessonId = "";
  let kind = "text";
  let title = "";
  let body = "";
  let url = "";
  let bookTitle = "";
  let file: { name: string; type: string; bytes: Uint8Array } | null = null;
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    lessonId = String(form.get("lesson_id") || "");
    kind = String(form.get("kind") || "upload");
    title = String(form.get("title") || "");
    body = String(form.get("body") || "");
    url = String(form.get("url") || "");
    bookTitle = String(form.get("book_title") || "");
    const uploaded = form.get("file");
    file = uploaded instanceof File ? await readFilePart(uploaded) : null;
  } else {
    let json: Record<string, unknown>;
    try {
      json = (await request.json()) as Record<string, unknown>;
    } catch {
      return deny(400, "invalid_json");
    }
    lessonId = typeof json.lesson_id === "string" ? json.lesson_id : "";
    kind = typeof json.kind === "string" ? json.kind : "text";
    title = typeof json.title === "string" ? json.title : "";
    body = typeof json.body === "string" ? json.body : "";
    url = typeof json.url === "string" ? json.url : "";
    bookTitle = typeof json.book_title === "string" ? json.book_title : "";
  }
  if (!body.trim()) return deny(400, "supplied_text_required");
  const result = await addSource(auth.identity, {
    lessonId,
    kind,
    title,
    body,
    url,
    bookTitle,
    file,
  });
  if ("error" in result) {
    const status =
      result.error === "unknown_lesson"
        ? 404
        : result.error === "file_too_large" || result.error === "org_quota"
          ? 413
          : 400;
    return deny(status, result.error ?? "invalid_source");
  }
  return NextResponse.json({
    ok: true,
    source: { id: result.source.id, kind: result.source.kind, title: result.source.title },
    units: result.units.map((unit: (typeof result.units)[number]) => ({
      id: unit.id,
      title: unit.title,
    })),
  });
}
