import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { asPortionAction, canReadPortion, canWritePortion } from "@/lib/portion/rules";
import { applyPortionSqlIfConfigured } from "@/lib/portion/sql";
import {
  PortionAccessError,
  PortionFieldsError,
  listNextPortions,
  lockNextPortion,
  overrideNextPortion,
  suggestNextPortion,
} from "@/lib/portion/store";
import { IntentAccessError } from "@/lib/intent/store";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requirePortionActor(request: Request, write: boolean) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  await applyPortionSqlIfConfigured();
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    ...auth.identity,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)
      ?.features,
  };
  const allowed = write ? canWritePortion(actor, staff) : canReadPortion(actor, staff);
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
    (typeof body?.membershipId === "string" && body.membershipId.trim()) ||
    (typeof body?.membership_id === "string" && body.membership_id.trim()) ||
    "";
  return fromQuery || fromBody;
}

export async function GET(request: Request) {
  const gate = await requirePortionActor(request, false);
  if (!gate.ok) return gate.response;
  const childMembershipId = childMembershipIdFrom(request);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  try {
    const listed = await listNextPortions({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: listed.current,
      locked: listed.locked,
      remaining: listed.remaining,
      versions: listed.versions,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof PortionAccessError) {
      return deny(error.status, error.code);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const gate = await requirePortionActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const childMembershipId = childMembershipIdFrom(request, body);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  try {
    const portion = await suggestNextPortion({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
      body,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: portion,
      locked: portion.status === "locked" ? portion : null,
      portion,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof PortionAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof PortionFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const gate = await requirePortionActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const childMembershipId = childMembershipIdFrom(request, body);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  const action = asPortionAction(body.action);
  if (!action) return deny(400, "invalid_action");
  try {
    const portion =
      action === "lock"
        ? await lockNextPortion({
            actor: gate.identity,
            childMembershipId,
            staff: gate.staff,
            portionId: typeof body.portionId === "string" ? body.portionId : undefined,
          })
        : await overrideNextPortion({
            actor: gate.identity,
            childMembershipId,
            staff: gate.staff,
            body,
          });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: portion,
      locked: portion.status === "locked" ? portion : null,
      portion,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof PortionAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof PortionFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}
