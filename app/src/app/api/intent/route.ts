import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { canReadIntent, canWriteIntent } from "@/lib/intent/rules";
import { applyIntentSqlIfConfigured } from "@/lib/intent/sql";
import { IntentAccessError, IntentFieldsError, listIntentVersions, writeIntentVersion } from "@/lib/intent/store";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireIntentActor(request: Request, write: boolean) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  await applyIntentSqlIfConfigured();
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    ...auth.identity,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)
      ?.features,
  };
  const allowed = write ? canWriteIntent(actor, staff) : canReadIntent(actor, staff);
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
  const gate = await requireIntentActor(request, false);
  if (!gate.ok) return gate.response;
  const childMembershipId = childMembershipIdFrom(request);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  try {
    const listed = await listIntentVersions({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: listed.current,
      versions: listed.versions,
    });
  } catch (error) {
    if (error instanceof IntentAccessError) {
      return deny(error.status, error.code);
    }
    throw error;
  }
}

async function write(request: Request, merge: boolean) {
  const gate = await requireIntentActor(request, true);
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
    const version = await writeIntentVersion({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
      body,
      merge,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: version,
      version,
    });
  } catch (error) {
    if (error instanceof IntentAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof IntentFieldsError) {
      return deny(400, "intent_fields_required");
    }
    throw error;
  }
}

export async function POST(request: Request) {
  return write(request, false);
}

export async function PATCH(request: Request) {
  return write(request, true);
}
