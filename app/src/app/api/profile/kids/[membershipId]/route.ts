import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { kidEditRefusal, sanitizeKidPatch } from "@/lib/profile/model";
import { isGuardianOf, loadKidProfile, updateKidProfile } from "@/lib/profile/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ membershipId: string }> };

async function parentScope(request: Request, childMembershipId: string) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, status: auth.status, error: auth.error };
  const actor = auth.identity;
  const scope = { orgId: actor.orgId, parentMembershipId: actor.membershipId };
  const guardian =
    actor.kind !== "child" && actor.orgSlug === "household"
      ? await isGuardianOf(scope, childMembershipId)
      : false;
  const refusal = kidEditRefusal(
    { kind: actor.kind, stance: actor.stance, orgSlug: actor.orgSlug, membershipId: actor.membershipId },
    guardian,
  );
  if (refusal) return { ok: false as const, status: 403, error: refusal };
  return { ok: true as const, scope };
}

function unavailable(error: unknown) {
  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
  throw error;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { membershipId } = await params;
    const parent = await parentScope(request, membershipId);
    if (!parent.ok) return NextResponse.json({ ok: false, error: parent.error }, { status: parent.status });
    const kid = await loadKidProfile(parent.scope, membershipId);
    if (!kid) return NextResponse.json({ ok: false, error: "not_your_child" }, { status: 403 });
    return NextResponse.json({ ok: true, kid });
  } catch (error) {
    return unavailable(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { membershipId } = await params;
    const parent = await parentScope(request, membershipId);
    if (!parent.ok) return NextResponse.json({ ok: false, error: parent.error }, { status: parent.status });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const clean = sanitizeKidPatch(body);
    if (!clean.ok) return NextResponse.json({ ok: false, error: clean.error }, { status: 400 });
    const kid = await updateKidProfile(parent.scope, membershipId, clean.patch);
    return NextResponse.json({ ok: true, kid });
  } catch (error) {
    return unavailable(error);
  }
}
