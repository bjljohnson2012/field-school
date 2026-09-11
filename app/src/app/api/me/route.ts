import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { memberships, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await identityFromRequest();
  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json({ authenticated: false, guest: true });
    }
    return NextResponse.json({ authenticated: false, error: result.error }, { status: 503 });
  }

  const db = getDb();
  const rows = await db
    .select({
      membershipId: memberships.id,
      stance: memberships.stance,
      orgSlug: organizations.slug,
      orgName: organizations.name,
      isolation: organizations.isolation,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(memberships.memberId, result.identity.memberId));

  return NextResponse.json({
    authenticated: true,
    member: {
      id: result.identity.memberId,
      email: result.identity.email,
      name: result.identity.name,
    },
    org: {
      slug: result.identity.orgSlug,
      isolation: result.identity.orgIsolation,
    },
    memberships: rows.map((row) => ({
      id: row.membershipId,
      stance: row.stance,
      org: row.orgSlug,
      isolation: row.isolation,
    })),
  });
}
