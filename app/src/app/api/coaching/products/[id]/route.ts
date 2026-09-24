import { NextResponse } from "next/server";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { isUuid } from "@/app/api/coaching/knowledge/visibility";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../../tasks/session";
import { ProductError, deleteProduct, updateProduct } from "../library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const { id } = await context.params;
  if (!isUuid(id)) return jsonError("invalid_body", 400);
  const body = await readJson(request);
  if (isResponse(body)) return body;
  try {
    const product = await updateProduct({
      orgId: loaded.actor.orgId,
      id,
      name: typeof body.name === "string" ? body.name : undefined,
      summary: typeof body.summary === "string" ? body.summary : body.summary === null ? null : undefined,
      audience: typeof body.audience === "string" ? body.audience : body.audience === null ? null : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    if (error instanceof ProductError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const { id } = await context.params;
  if (!isUuid(id)) return jsonError("invalid_body", 400);
  try {
    const removed = await deleteProduct(loaded.actor.orgId, id);
    return NextResponse.json({ ok: true, product: removed });
  } catch (error) {
    if (error instanceof ProductError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
