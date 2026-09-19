import { NextResponse } from "next/server";
import { deny, requireMember, requireTeacher } from "@/lib/composer/access";
import { applyPlateRendersSqlIfConfigured } from "@/lib/plates/sql";
import { listPlates, registerPlate } from "@/lib/plates/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMember(request);
  if (!auth.ok) return auth.response;
  await applyPlateRendersSqlIfConfigured();
  const plates = await listPlates(auth.identity);
  return NextResponse.json({
    ok: true,
    hold_cleaning: true,
    auto_flip: false,
    plates: plates.map((row) => ({
      id: row.id,
      composition: row.composition,
      dest: row.dest,
      sha256: row.sha256,
      status: row.status,
      hold_cleaning: row.holdCleaning,
    })),
  });
}

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
  const result = await registerPlate(auth.identity, {
    composition: typeof body.composition === "string" ? body.composition : "",
    dest: typeof body.dest === "string" ? body.dest : "",
    sha256: typeof body.sha256 === "string" ? body.sha256 : "",
    checklistVerdict: typeof body.checklist_verdict === "string" ? body.checklist_verdict : "",
  });
  if ("error" in result) return deny(400, result.error);
  return NextResponse.json({
    ok: true,
    hold_cleaning: true,
    plate: {
      id: result.plate.id,
      status: result.plate.status,
      composition: result.plate.composition,
      dest: result.plate.dest,
    },
  });
}
