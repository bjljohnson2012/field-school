import { NextResponse } from "next/server";
import { extractArticleMetadata } from "@/lib/ai/prompts/knowledge";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../../tasks/session";
import { loadLibraryCoach } from "../access";
import { isRepoKind } from "../visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";
  const repositoryKind = typeof body.repositoryKind === "string" ? body.repositoryKind.trim().toUpperCase() : "";
  const repositoryName = typeof body.repositoryName === "string" ? body.repositoryName.trim() : "";
  if (!rawText || !isRepoKind(repositoryKind) || !repositoryName) return jsonError("invalid_body", 400);
  const article = await extractArticleMetadata({
    rawText,
    repositoryKind,
    repositoryName,
    filename: typeof body.filename === "string" ? body.filename : undefined,
  });
  return NextResponse.json({ ok: true, article });
}
