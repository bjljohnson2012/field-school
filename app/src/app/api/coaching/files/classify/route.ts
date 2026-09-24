import { NextResponse } from "next/server";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { classifyFile } from "@/lib/ai/prompts/knowledge";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../../tasks/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function candidateAes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { id?: unknown; name?: unknown };
      const id = typeof row.id === "string" ? row.id.trim() : "";
      const name = typeof row.name === "string" ? row.name.trim() : "";
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((item): item is { id: string; name: string } => Boolean(item));
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  if (!filename) return jsonError("invalid_body", 400);
  const suggestion = await classifyFile({
    filename,
    mimeType: typeof body.mimeType === "string" ? body.mimeType : "application/octet-stream",
    textPreview: typeof body.textPreview === "string" ? body.textPreview.slice(0, 4000) : "",
    candidateAes: candidateAes(body.candidateAes),
  });
  return NextResponse.json({
    ok: true,
    suggestion: {
      kind: suggestion.kind,
      intent: suggestion.updateIntent,
      visibility: suggestion.visibility,
      confidence: suggestion.confidence,
      rationale: suggestion.rationale,
      aeProfileId: suggestion.aeProfileId ?? null,
    },
  });
}
