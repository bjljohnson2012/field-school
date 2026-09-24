import { NextResponse } from "next/server";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { isUuid } from "@/app/api/coaching/knowledge/visibility";
import { synthesizeProductBrief } from "@/lib/ai/prompts/knowledge";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../../tasks/session";
import { ProductError, updateProduct } from "../library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sourceTexts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { filename?: unknown; text?: unknown };
      const filename = typeof row.filename === "string" ? row.filename.trim() : "";
      const text = typeof row.text === "string" ? row.text.trim() : "";
      if (!text) return null;
      return { filename: filename || "source.txt", text };
    })
    .filter((item): item is { filename: string; text: string } => Boolean(item));
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const productName = typeof body.productName === "string" ? body.productName.trim() : "";
  const texts = sourceTexts(body.sourceTexts);
  if (!productName || !texts.length) return jsonError("invalid_body", 400);
  const audience = typeof body.audience === "string" ? body.audience.trim() : undefined;
  const brief = await synthesizeProductBrief({ productName, audience, sourceTexts: texts });
  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  if (productId && !isUuid(productId)) return jsonError("invalid_body", 400);
  try {
    const product = productId
      ? await updateProduct({
          orgId: loaded.actor.orgId,
          id: productId,
          summary: brief.summary,
          audience: audience ?? null,
        })
      : null;
    return NextResponse.json({ ok: true, brief, product });
  } catch (error) {
    if (error instanceof ProductError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
