import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { canReadBrain } from "@/lib/brain/rules";
import { isStaffEmail } from "@/lib/auth/staff";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { readLibraryBrain } from "@/lib/brains/read";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_has_no_login" }, { status: 403 });
  }
  const staff = isStaffEmail(auth.identity.email);
  const features = auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)?.features;
  if (!canReadBrain({ ...auth.identity, features }, staff)) {
    return NextResponse.json({ ok: false, error: "not_allowed", nodes: [], edges: [] }, { status: 403 });
  }
  const url = new URL(request.url);
  try {
    const brain = await readLibraryBrain(auth.identity, {
      growthUnitId: url.searchParams.get("growthUnit"),
      childMembershipId: url.searchParams.get("child"),
    });
    return NextResponse.json({ ok: true, ...brain });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: true, brainId: null, nodes: [], edges: [] });
    }
    throw error;
  }
}
