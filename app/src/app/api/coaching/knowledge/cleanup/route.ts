import { NextResponse } from "next/server";
import { cleanupArticleWithInstructions } from "@/lib/ai/prompts/knowledge";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../../tasks/session";
import { loadLibraryCoach } from "../access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const articleBody = typeof body.body === "string" ? body.body : "";
  const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";
  const tags = Array.isArray(body.tags) ? body.tags.filter((item): item is string => typeof item === "string") : [];
  if (!title || !articleBody.trim() || !instructions) return jsonError("invalid_body", 400);
  const article = await cleanupArticleWithInstructions({
    title,
    body: articleBody,
    tags,
    instructions,
    repositoryName: typeof body.repositoryName === "string" ? body.repositoryName : undefined,
  });
  return NextResponse.json({ ok: true, article });
}
