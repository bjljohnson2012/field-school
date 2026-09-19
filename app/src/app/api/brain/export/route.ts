import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { canReadBrain } from "@/lib/brain/rules";
import { applyBrainSqlIfConfigured } from "@/lib/brain/sql";
import { BrainAccessError, exportKnowledgeBrain } from "@/lib/brain/store";
import { IntentAccessError } from "@/lib/intent/store";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return deny(auth.status, auth.error);
  await applyBrainSqlIfConfigured();
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    ...auth.identity,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)
      ?.features,
  };
  if (!canReadBrain(actor, staff)) {
    const error =
      auth.identity.kind === "child"
        ? "child_cannot_write"
        : auth.identity.orgSlug !== "household"
          ? "family_mode_only"
          : "household_guardian_only";
    return deny(403, error);
  }
  const growthUnitId = new URL(request.url).searchParams.get("growth_unit_id")?.trim() || "";
  if (!growthUnitId) return deny(400, "growth_unit_id_required");
  try {
    const exported = await exportKnowledgeBrain({
      actor: auth.identity,
      staff,
      growthUnitId,
    });
    return NextResponse.json({
      ok: true,
      mode: actor.mode ?? "none",
      growthUnitId,
      ...exported,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof BrainAccessError) {
      return deny(error.status, error.code);
    }
    throw error;
  }
}
