import { NextResponse } from "next/server";
import { loadSession } from "@/lib/campus-runtime/identity";
import { featureMode } from "@/lib/intent/family-mode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await loadSession(request);
  if (!session) {
    return NextResponse.json({ authenticated: false, guest: true });
  }
  const memberships = session.rows
    .filter((row) => session.member.kind !== "child" || row.orgSlug !== "sales")
    .map((row) => ({
      id: row.membershipId,
      stance: row.stance,
      org: row.orgSlug,
      name: row.orgName,
      kind: row.orgKind,
      isolation: row.isolation,
    }));
  const active = session.active && memberships.some((m) => m.org === session.active?.orgSlug)
    ? session.active
    : null;
  return NextResponse.json({
    authenticated: true,
    member: {
      id: session.member.id,
      email: session.member.email,
      name: session.member.name,
      kind: session.member.kind,
      mode: session.member.mode ?? "none",
    },
    activeOrg: active
      ? {
          slug: active.orgSlug,
          name: active.orgName,
          isolation: active.isolation,
          stance: active.stance,
          membershipId: active.membershipId,
          mode: featureMode(active.features),
        }
      : null,
    org: active
      ? { slug: active.orgSlug, isolation: active.isolation }
      : null,
    memberships,
  });
}
