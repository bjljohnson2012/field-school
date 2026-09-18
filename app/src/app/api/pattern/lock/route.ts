import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import {
  ProfileLockedError,
  ProfileMissingError,
  publicProfile,
  setLock,
} from "@/lib/pattern/profile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const childMembershipId =
    typeof body.membership_id === "string" ? body.membership_id : "";
  if (!childMembershipId) {
    return NextResponse.json({ ok: false, error: "membership_id_required" }, { status: 400 });
  }
  try {
    const profile = await setLock({
      actor: auth.identity,
      childMembershipId,
      locked: body.locked !== false,
    });
    return NextResponse.json({ ok: true, profile: publicProfile(profile) });
  } catch (error) {
    if (error instanceof ProfileLockedError) {
      return NextResponse.json({ ok: false, error: "not_guardian" }, { status: 403 });
    }
    if (error instanceof ProfileMissingError) {
      return NextResponse.json({ ok: false, error: "profile_required" }, { status: 409 });
    }
    throw error;
  }
}
