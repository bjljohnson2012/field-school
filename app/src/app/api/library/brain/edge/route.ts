import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { canWriteBrain } from "@/lib/brain/rules";
import { isStaffEmail } from "@/lib/auth/staff";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { setLibraryEdgeStatus } from "@/lib/brains/read";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_has_no_login" }, { status: 403 });
  }
  const staff = isStaffEmail(auth.identity.email);
  const features = auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)?.features;
  if (!canWriteBrain({ ...auth.identity, features }, staff)) {
    return NextResponse.json({ ok: false, error: "not_leader" }, { status: 403 });
  }
  let body: { edgeId?: string; action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const edgeId = typeof body.edgeId === "string" ? body.edgeId.trim() : "";
  const action = body.action === "confirm" ? "accepted" : body.action === "reject" ? "rejected" : "";
  if (!edgeId || !action) return NextResponse.json({ ok: false, error: "edge_required" }, { status: 400 });
  try {
    const edge = await setLibraryEdgeStatus(auth.identity, edgeId, action);
    if (!edge) return NextResponse.json({ ok: false, error: "edge_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, edge });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
}
