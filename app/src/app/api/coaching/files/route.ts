import { NextResponse } from "next/server";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { isUuid } from "@/app/api/coaching/knowledge/visibility";
import { writeCoachingAudit } from "@/lib/coaching/audit";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../tasks/session";
import { FileError, listFiles, storeConfirmedFile } from "./library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function suggestionOf(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as {
    kind?: unknown;
    intent?: unknown;
    confidence?: unknown;
    rationale?: unknown;
  };
  const confidence =
    typeof row.confidence === "number" && Number.isFinite(row.confidence) ? row.confidence : null;
  return {
    kind: typeof row.kind === "string" ? row.kind : null,
    intent: typeof row.intent === "string" ? row.intent : null,
    confidence,
    rationale: typeof row.rationale === "string" ? row.rationale : null,
  };
}

export async function GET(request: Request) {
  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const subject = new URL(request.url).searchParams.get("subject")?.trim() ?? "";
  if (subject && !isUuid(subject)) return jsonError("invalid_body", 400);
  try {
    const files = await listFiles(loaded.actor.orgId, subject || undefined);
    return NextResponse.json({ ok: true, name: loaded.name, files });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const suggestion = suggestionOf(body.suggestion);
  if (!suggestion) return jsonError("confirm_required", 400);
  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const kind = typeof body.kind === "string" ? body.kind.trim() : "";
  const intent = typeof body.intent === "string" ? body.intent.trim() : "";
  const subjectMembershipId = typeof body.subjectMembershipId === "string" ? body.subjectMembershipId.trim() : "";
  const text = typeof body.text === "string" ? body.text : "";
  const contentBase64 = typeof body.contentBase64 === "string" ? body.contentBase64 : "";
  if (!filename || !kind || !intent) return jsonError("invalid_body", 400);
  let bytes: Buffer;
  try {
    bytes = contentBase64 ? Buffer.from(contentBase64, "base64") : Buffer.from(text, "utf8");
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!bytes.byteLength) return jsonError("invalid_body", 400);
  if (bytes.byteLength > 25 * 1024 * 1024) return jsonError("invalid_body", 400);
  try {
    const file = await storeConfirmedFile({
      orgId: loaded.actor.orgId,
      authorMembershipId: loaded.actor.membershipId,
      filename,
      mime: typeof body.mime === "string" ? body.mime : null,
      text,
      bytes,
      kind,
      intent,
      visibility: body.visibility,
      subjectMembershipId,
      suggestion,
    });
    await writeCoachingAudit({
      orgId: loaded.actor.orgId,
      actorMembershipId: loaded.actor.membershipId,
      action: "coaching_file.map",
      targetType: "coaching_source",
      targetId: file.id,
      metadata: {
        kind: file.kind,
        intent,
        visibility: file.visibility,
        subjectMembershipId: file.subjectMembershipId || null,
      },
    });
    return NextResponse.json({ ok: true, file });
  } catch (error) {
    if (error instanceof FileError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
