import { NextResponse } from "next/server";
import { loadSession } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { sanitizeAdultPatch } from "@/lib/profile/model";
import { listKidProfiles, loadAdultProfile, updateAdultProfile } from "@/lib/profile/store";

export const dynamic = "force-dynamic";

async function adultOwner(request: Request) {
  const session = await loadSession(request);
  if (!session) return { ok: false as const, status: 401, error: "sign_in_required" };
  if ((session.member.kind ?? "adult") === "child") {
    return { ok: false as const, status: 403, error: "child_has_no_adult_profile" };
  }
  return {
    ok: true as const,
    owner: { memberId: session.member.id, name: session.user.name },
    active: session.active,
    kind: session.member.kind ?? "adult",
  };
}

function unavailable(error: unknown) {
  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
  throw error;
}

export async function GET(request: Request) {
  try {
    const auth = await adultOwner(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const profile = await loadAdultProfile(auth.owner);
    const household = auth.active?.orgSlug === "household" ? auth.active : null;
    const kids = household
      ? await listKidProfiles({ orgId: household.orgId, parentMembershipId: household.membershipId })
      : [];
    return NextResponse.json({ ok: true, profile, kids, room: auth.active?.orgSlug ?? "" });
  } catch (error) {
    return unavailable(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await adultOwner(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const clean = sanitizeAdultPatch(body);
    if (!clean.ok) return NextResponse.json({ ok: false, error: clean.error }, { status: 400 });
    const profile = await updateAdultProfile(auth.owner, clean.patch);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return unavailable(error);
  }
}
