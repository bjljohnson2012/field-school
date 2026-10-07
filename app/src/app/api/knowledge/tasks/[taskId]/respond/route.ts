import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getDocumentProxy } from "unpdf";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { pdfText } from "@/lib/enrichment/pdf-text";
import { GapAccessError, GapFieldsError } from "@/lib/gap-loop/errors";
import { outcomeWrite } from "@/lib/gap-loop/rules";
import { cell, saveTaskResponse, taskResponse } from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ taskId: string }> };

const TEXT_CAP = 20_000;
const BYTE_CAP = 8 * 1024 * 1024;

function sha(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { taskId } = await params;
    if (!isUuid(taskId)) return NextResponse.json({ ok: false, error: "unknown_task" }, { status: 404 });
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    if (body.channel === "web" || body.kind === "web") throw new GapFieldsError("web_research_not_in_m1");
    const row = await taskResponse(taskId, gate.actor);
    if (!row) throw new GapAccessError(404, "unknown_task");
    const ownerKind = cell(row, "owner_kind") === "child" ? "child" : "person";
    const allowed = outcomeWrite(gate.actor, ownerKind, gate.staff);
    if (!allowed.ok) throw new GapAccessError(403, allowed.error);
    if (!gate.staff && cell(row, "owner_membership_id") !== gate.actor.membershipId) {
      throw new GapAccessError(403, "forbidden");
    }
    const kind = typeof body.kind === "string" ? body.kind : "";
    if (kind === "decline") {
      await saveTaskResponse(row, { kind: "decline", text: "", sha256: "", filename: "", rating: "", evidenceKind: "upload", provesUse: false });
      return NextResponse.json({ ok: true, outcomeId: cell(row, "outcome_id"), declined: true });
    }
    let text = typeof body.text === "string" ? body.text.trim() : "";
    let filename = typeof body.filename === "string" ? body.filename.trim().slice(0, 180) : "";
    let digest = "";
    if (kind === "pdf") {
      const encoded = typeof body.pdfBase64 === "string" ? body.pdfBase64 : "";
      const bytes = Buffer.from(encoded, "base64");
      if (!bytes.length || bytes.length > BYTE_CAP) throw new GapFieldsError("upload_too_large");
      if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new GapFieldsError("pdf_unreadable");
      try {
        const pdf = await getDocumentProxy(new Uint8Array(bytes));
        if (pdf.numPages > 12) throw new GapFieldsError("pdf_page_cap");
      } catch (error) {
        if (error instanceof GapFieldsError) throw error;
        throw new GapFieldsError("pdf_unreadable");
      }
      const extracted = await pdfText(new Uint8Array(bytes));
      if (!extracted) throw new GapFieldsError("pdf_unreadable");
      text = extracted.trim();
      digest = sha(bytes);
      if (!filename) filename = "notes.pdf";
    }
    if (text.length > TEXT_CAP) throw new GapFieldsError("upload_too_large");
    if (!text) throw new GapFieldsError("text_required");
    if (!digest) digest = sha(text);
    const rating = body.rating === "ready" || body.rating === "getting_there" || body.rating === "not_yet" ? body.rating : "";
    if (kind === "rating" && !rating) throw new GapFieldsError("rating_required");
    const evidenceKind =
      kind === "rating"
        ? rating === "ready"
          ? "parent_ready"
          : rating === "getting_there"
            ? "parent_getting_there"
            : "parent_not_yet"
        : kind === "answer" && text.length >= 12
          ? "artifact"
          : "upload";
    const provesUse = evidenceKind === "parent_ready" || evidenceKind === "parent_getting_there" || evidenceKind === "artifact";
    await saveTaskResponse(row, { kind, text, sha256: digest, filename, rating, evidenceKind, provesUse });
    return NextResponse.json({ ok: true, outcomeId: cell(row, "outcome_id"), declined: false });
  } catch (error) {
    return gapError(error);
  }
}
