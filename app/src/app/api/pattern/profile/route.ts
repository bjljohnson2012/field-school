import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import {
  getLiveProfile,
  isGuardianOf,
  listRevisions,
  publicProfile,
} from "@/lib/pattern/profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const url = new URL(request.url);
  const membershipId =
    url.searchParams.get("membership_id")?.trim() || auth.identity.membershipId;
  if (membershipId !== auth.identity.membershipId) {
    const allowed = await isGuardianOf(auth.identity, membershipId);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }
  const profile = await getLiveProfile(auth.identity.orgId, membershipId);
  if (!profile) {
    return NextResponse.json({ ok: true, profile: null, revisions: [] });
  }
  const revisions = await listRevisions(profile.id, 12);
  return NextResponse.json({
    ok: true,
    profile: publicProfile(profile),
    revisions: revisions.map((row) => ({
      id: row.id,
      cause: row.cause,
      bearing: Number(row.bearingDeg),
      correspondence: row.correspondence,
      createdAt: row.createdAt,
    })),
  });
}
