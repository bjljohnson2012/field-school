import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { memberships, organizations } from "@/lib/db/schema";

export const ORG_COOKIE = "fs_org";
export const OPERATOR_SLUG = "field-school";
export const HOUSEHOLD_SLUG = "household";
export const SALES_SLUG = "sales";

export function studentOrgs() {
  return [HOUSEHOLD_SLUG, SALES_SLUG];
}

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

export function pickActiveSlug(
  requested: string,
  slugs: string[],
  memberKind: string,
) {
  const allowed = memberKind === "child"
    ? slugs.filter((s) => s !== SALES_SLUG)
    : slugs;
  if (requested && allowed.includes(requested)) return requested;
  if (allowed.includes(HOUSEHOLD_SLUG)) return HOUSEHOLD_SLUG;
  if (allowed.includes(SALES_SLUG)) return SALES_SLUG;
  return allowed[0] || "";
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

export function courseAllowedInOrg(orgSlug: string, course: string) {
  if (orgSlug === HOUSEHOLD_SLUG) return course === "home";
  if (orgSlug === SALES_SLUG) return course === "sales";
  return course === "grok-bot";
}

export async function ensureTenantOrgs() {
  const db = getDb();
  await db
    .insert(organizations)
    .values({
      slug: SALES_SLUG,
      name: "Sales team",
      kind: "company",
      isolation: "platform_plus",
    })
    .onConflictDoNothing();
}
