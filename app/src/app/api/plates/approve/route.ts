import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { applyPlateRendersSqlIfConfigured } from "@/lib/plates/sql";
import { decidePlateRow } from "@/lib/plates/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  await applyPlateRendersSqlIfConfigured();
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return deny(400, "id_required");
  const result = await decidePlateRow(auth.identity, id, "approve");
  if ("error" in result) {
    return deny(result.error === "unknown_plate" ? 404 : 400, result.error ?? "decide_failed");
  }
  if (!result.plate) return deny(400, "decide_failed");
  return NextResponse.json({
    ok: true,
    hold_cleaning: true,
    auto_flip: false,
    plate: { id: result.plate.id, status: result.plate.status },
  });
}
