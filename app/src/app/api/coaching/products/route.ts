import { NextResponse } from "next/server";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isResponse, jsonError, readJson } from "../tasks/session";
import { ProductError, createProduct, listProducts } from "./library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  try {
    const rows = await listProducts(loaded.actor.orgId);
    return NextResponse.json({ ok: true, name: loaded.name, products: rows });
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
  const name = typeof body.name === "string" ? body.name : "";
  try {
    const product = await createProduct({
      orgId: loaded.actor.orgId,
      name,
      summary: typeof body.summary === "string" ? body.summary : null,
      audience: typeof body.audience === "string" ? body.audience : null,
      active: body.active !== false,
    });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    if (error instanceof ProductError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
