import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { applyWave2SqlIfConfigured } from "@/lib/db/apply-wave2-sql";
import { getDb } from "@/lib/db/client";
import { memberships, organizations } from "@/lib/db/schema";
import {
  HOUSEHOLD_SLUG,
  OPERATOR_SLUG,
  SALES_SLUG,
  courseAllowedInOrg,
  pickActiveSlug,
  studentOrgs,
} from "./rules";

export { HOUSEHOLD_SLUG, OPERATOR_SLUG, SALES_SLUG, courseAllowedInOrg, pickActiveSlug, studentOrgs };
export {
  canCreateChild,
  canMintInvite,
  childCanAdmin,
  defaultInviteStance,
  inviteStanceAllowed,
  shouldForceOperatorOrg,
} from "./rules";

export const ORG_COOKIE = "fs_org";

export async function getOrgBySlug(slug: string) {
  const db = getDb();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return org ?? null;
}

export async function membershipsForMember(memberId: string) {
  const db = getDb();
  return db
    .select({
      membershipId: memberships.id,
      stance: memberships.stance,
      orgId: organizations.id,
      orgSlug: organizations.slug,
      orgName: organizations.name,
      orgKind: organizations.kind,
      isolation: organizations.isolation,
      features: organizations.features,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(memberships.memberId, memberId));
}

export async function requestedOrgSlug(request?: Request) {
  if (request) {
    const url = new URL(request.url);
    const q = url.searchParams.get("org")?.trim();
    if (q) return q;
    const header = request.headers.get("x-fs-org")?.trim();
    if (header) return header;
    const path = url.pathname.match(/^\/o\/([^/]+)/);
    if (path?.[1]) return path[1];
  }
  const jar = await cookies();
  return jar.get(ORG_COOKIE)?.value?.trim() || "";
}

export async function setActiveOrgCookie(slug: string) {
  const jar = await cookies();
  jar.set(ORG_COOKIE, slug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function ensureTenantOrgs() {
  await applyWave2SqlIfConfigured();
  const db = getDb();
  await db
    .insert(organizations)
    .values([
      {
        slug: HOUSEHOLD_SLUG,
        name: "Household",
        kind: "homeschool",
        isolation: "strict",
        features: { cap: false },
      },
      {
        slug: SALES_SLUG,
        name: "Sales team",
        kind: "company",
        isolation: "platform_plus",
        features: { cap: false },
      },
    ])
    .onConflictDoNothing();
}
