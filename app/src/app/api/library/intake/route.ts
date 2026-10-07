import { inflateRawSync } from "node:zlib";
import { NextResponse } from "next/server";
import { transcribe } from "@/lib/ai/client";
import { deny, requireTeacher } from "@/lib/composer/access";
import { pdfText } from "@/lib/enrichment/pdf-text";
import { NEEDS_MORE } from "@/lib/library/teach-from-knowledge";
import { intakeKnowledge } from "@/lib/library/submit-knowledge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

function zipEntry(bytes: Uint8Array, name: string): string | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const fileName = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    if ((flags & 0x8) && compSize === 0) return null;
    const dataEnd = dataStart + compSize;
    if (dataEnd > bytes.length) return null;
    if (fileName === name) {
      const slice = bytes.subarray(dataStart, dataEnd);
      try {
        const xml = method === 0 ? slice : method === 8 ? inflateRawSync(slice) : null;
        return xml ? new TextDecoder().decode(xml) : null;
      } catch {
        return null;
      }
    }
    offset = dataEnd;
  }
  return null;
}

function docxText(bytes: Uint8Array): string | null {
  const xml = zipEntry(bytes, "word/document.xml");
  if (!xml) return null;
  const text = xml
    .replace(/<w:p\b[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length >= 12 ? text.slice(0, 20000) : null;
}

async function textFromFile(file: File): Promise<{ text: string; filename: string } | { message: string }> {
  if (file.size > MAX_BYTES) return { message: NEEDS_MORE };
  const filename = file.name || "upload";
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || "";
  if (mime.startsWith("audio/") || /\.(webm|m4a|mp3|wav|ogg)$/i.test(filename)) {
    try {
      const text = await transcribe(Buffer.from(bytes), filename, mime || "audio/webm");
      return text.trim() ? { text, filename } : { message: NEEDS_MORE };
    } catch {
      return { message: NEEDS_MORE };
    }
  }
  if (mime === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
    const text = await pdfText(bytes);
    return text?.trim() ? { text, filename } : { message: NEEDS_MORE };
  }
  if (filename.toLowerCase().endsWith(".docx")) {
    const text = docxText(bytes);
    return text ? { text, filename } : { message: NEEDS_MORE };
  }
  const asText = new TextDecoder().decode(bytes).replace(/\u0000/g, "").trim();
  if (!asText || asText.length < 12) return { message: NEEDS_MORE };
  return { text: asText.slice(0, 20000), filename };
}

export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  const type = request.headers.get("content-type") || "";
  const drops: { text: string; filename?: string; kind?: string }[] = [];
  if (type.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return deny(400, "invalid_json");
    }
    const notes = form.get("items");
    if (typeof notes === "string" && notes.trim()) {
      try {
        const parsed = JSON.parse(notes) as unknown;
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const row = item as { text?: unknown; filename?: unknown; kind?: unknown };
            if (typeof row.text === "string" && row.text.trim()) {
              drops.push({
                text: row.text,
                filename: typeof row.filename === "string" ? row.filename : undefined,
                kind: typeof row.kind === "string" ? row.kind : "text",
              });
            }
          }
        }
      } catch {
        return deny(400, "invalid_json");
      }
    }
    let unread = false;
    for (const value of form.values()) {
      if (!(value instanceof File) || !value.size) continue;
      const read = await textFromFile(value);
      if ("message" in read) {
        unread = true;
        continue;
      }
      drops.push({ text: read.text, filename: read.filename, kind: "file" });
    }
    if (!drops.length && unread) {
      return NextResponse.json({ ok: true, status: "needs_more", message: NEEDS_MORE, items: [] });
    }
  } else {
    let body: { items?: unknown };
    try {
      body = (await request.json()) as { items?: unknown };
    } catch {
      return deny(400, "invalid_json");
    }
    if (!Array.isArray(body.items)) return deny(400, "invalid_spec");
    for (const item of body.items) {
      if (!item || typeof item !== "object") continue;
      const row = item as { text?: unknown; filename?: unknown; kind?: unknown };
      if (typeof row.text !== "string") continue;
      drops.push({
        text: row.text,
        filename: typeof row.filename === "string" ? row.filename : undefined,
        kind: typeof row.kind === "string" ? row.kind : "text",
      });
    }
  }
  const result = await intakeKnowledge(auth.identity, drops);
  if ("error" in result && typeof result.error === "string") return deny(400, result.error);
  return NextResponse.json({ ok: true, status: "stored", items: result.items });
}
