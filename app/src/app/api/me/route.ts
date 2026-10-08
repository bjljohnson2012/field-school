import { NextResponse } from "next/server";
import { readOrgLogoUrl } from "@/components/org-logo";
import { isStaffEmail } from "@/lib/auth/staff";
import { loadSession } from "@/lib/campus-runtime/identity";
import { memberPlatformAdmin } from "@/lib/coaching/scores";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { featureMode } from "@/lib/intent/family-mode";
import { listKidProfiles } from "@/lib/profile/store";

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
  const platformAdmin = await memberPlatformAdmin(session.member.id);
  const household = active?.orgSlug === "household" && session.member.kind !== "child" ? active : null;
  const profiles = household
    ? await listKidProfiles({ orgId: household.orgId, parentMembershipId: household.membershipId }).catch(
        (error: unknown) => {
          if (error instanceof DatabaseUnavailableError) return [];
          throw error;
        },
      )
    : [];
  return NextResponse.json({
    authenticated: true,
    platformAdmin,
    canAdmin: platformAdmin || isStaffEmail(session.member.email) || active?.stance === "admin",
    logoUrl: readOrgLogoUrl(active?.features),
    profiles: profiles.map((kid) => ({ membershipId: kid.membershipId, displayName: kid.displayName })),
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
