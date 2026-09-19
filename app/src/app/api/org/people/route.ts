import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_cannot_list" }, { status: 403 });
  }
  const staff = isStaffEmail(auth.identity.email);
  const allowedOrgs = new Set(auth.memberships.map((row) => row.orgSlug));
  const db = getDb();
  const rows = await db
    .select({
      membershipId: memberships.id,
      stance: memberships.stance,
      org: organizations.slug,
      orgName: organizations.name,
      name: members.name,
      kind: members.kind,
    })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId));
  const people = staff
    ? rows
    : rows.filter((row) => allowedOrgs.has(row.org));
  return NextResponse.json({
    ok: true,
    org: auth.identity.orgSlug,
    staff,
    people: people.map((row) => ({
      membershipId: row.membershipId,
      name: row.name,
      kind: row.kind,
      stance: row.stance,
      org: row.org,
      orgName: row.orgName,
      login: row.kind === "child" ? "none" : "member",
    })),
  });
}
