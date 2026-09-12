import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { ProfileLockedError, linkWard } from "@/lib/pattern/profile";

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
    typeof body.child_membership_id === "string" ? body.child_membership_id : "";
  if (!childMembershipId) {
    return NextResponse.json({ ok: false, error: "child_membership_id_required" }, { status: 400 });
  }
  try {
    const ward = await linkWard({
      actor: auth.identity,
      childMembershipId,
    });
    return NextResponse.json({ ok: true, ward });
  } catch (error) {
    if (error instanceof ProfileLockedError) {
      return NextResponse.json({ ok: false, error: "not_guardian" }, { status: 403 });
    }
    throw error;
  }
}
