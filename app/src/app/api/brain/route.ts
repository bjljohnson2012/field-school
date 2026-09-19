import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { asGrowthKind, canReadBrain, canWriteBrain } from "@/lib/brain/rules";
import { applyBrainSqlIfConfigured } from "@/lib/brain/sql";
import {
  BrainAccessError,
  BrainFieldsError,
  deleteKnowledgeBrain,
  listKnowledgeBrains,
  writeKnowledgeBrain,
} from "@/lib/brain/store";
import { IntentAccessError } from "@/lib/intent/store";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireBrainActor(request: Request, write: boolean) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  await applyBrainSqlIfConfigured();
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    ...auth.identity,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)
      ?.features,
  };
  const allowed = write ? canWriteBrain(actor, staff) : canReadBrain(actor, staff);
  if (!allowed) {
    const error =
      auth.identity.kind === "child"
        ? "child_cannot_write"
        : auth.identity.orgSlug !== "household"
          ? "family_mode_only"
          : "household_guardian_only";
    return { ok: false as const, response: deny(403, error) };
  }
  return { ok: true as const, identity: auth.identity, staff, mode: actor.mode ?? "none" };
}

function childMembershipIdFrom(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("child_membership_id")?.trim() || "";
  const fromBody =
    (typeof body?.childMembershipId === "string" && body.childMembershipId.trim()) ||
    (typeof body?.child_membership_id === "string" && body.child_membership_id.trim()) ||
    "";
  return fromQuery || fromBody;
}

function growthUnitIdFrom(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("growth_unit_id")?.trim() || "";
  const fromBody =
    (typeof body?.growthUnitId === "string" && body.growthUnitId.trim()) ||
    (typeof body?.growth_unit_id === "string" && body.growth_unit_id.trim()) ||
    "";
  return fromQuery || fromBody;
}

function kindFrom(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("kind")?.trim() || "";
  const fromBody = typeof body?.kind === "string" ? body.kind.trim() : "";
  return fromQuery || fromBody;
}

export async function GET(request: Request) {
  const gate = await requireBrainActor(request, false);
  if (!gate.ok) return gate.response;
  const childMembershipId = childMembershipIdFrom(request);
  const growthUnitId = growthUnitIdFrom(request);
  const kind = kindFrom(request);
  if (kind && !asGrowthKind(kind)) return deny(400, "invalid_kind");
  if (kind && kind !== "family" && kind !== "child" && !growthUnitId && !childMembershipId) {
    return deny(403, "family_mode_only");
  }
  try {
    const listed = await listKnowledgeBrains({
      actor: gate.identity,
      staff: gate.staff,
      growthUnitId: growthUnitId || undefined,
      childMembershipId: childMembershipId || undefined,
      kind: kind || undefined,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId: childMembershipId || undefined,
      growthUnitId: growthUnitId || undefined,
      kind: kind || undefined,
      ...listed,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof BrainAccessError) {
      return deny(error.status, error.code);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const gate = await requireBrainActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  try {
    const written = await writeKnowledgeBrain({
      actor: gate.identity,
      staff: gate.staff,
      body,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId: written.unit.childMembershipId,
      growthUnitId: written.unit.id,
      unit: written.unit,
      current: written.current,
      brain: written.current,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof BrainAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof BrainFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const gate = await requireBrainActor(request, true);
  if (!gate.ok) return gate.response;
  const growthUnitId = growthUnitIdFrom(request);
  if (!growthUnitId) return deny(400, "growth_unit_id_required");
  try {
    const deleted = await deleteKnowledgeBrain({
      actor: gate.identity,
      staff: gate.staff,
      growthUnitId,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      ...deleted,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof BrainAccessError) {
      return deny(error.status, error.code);
    }
    throw error;
  }
}
