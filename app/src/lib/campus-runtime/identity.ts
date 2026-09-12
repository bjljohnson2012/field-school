import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffEmail } from "@/lib/auth/staff";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/members/policy";
import {
  ensureTenantOrgs,
  membershipsForMember,
  pickActiveSlug,
  requestedOrgSlug,
} from "./org";

export const ORG0_SLUG = "field-school";
export const HOUSEHOLD_SLUG = "household";
export const SALES_SLUG = "sales";

export type LearnerIdentity = {
  memberId: string;
  email: string;
  name: string;
  kind: string;
  membershipId: string;
  orgId: string;
  orgSlug: string;
  orgIsolation: string;
  stance: string;
};

export async function getAuthUser() {
  const session = await auth();
  const email = normalizeEmail(session?.user?.email);
  if (!email) return null;
  return {
    email,
    name: session?.user?.name?.trim() || email.split("@")[0],
    role: session?.user?.role === "admin" ? "admin" : "member",
    id: session?.user?.id,
  };
}

export async function upsertMember(email: string, name: string) {
  const db = getDb();
  const mail = normalizeEmail(email);
  const existing = await db.select().from(members).where(eq(members.email, mail)).limit(1);
  if (existing[0]) {
    if (name.trim() && existing[0].name !== name.trim()) {
      const [updated] = await db
        .update(members)
        .set({ name: name.trim() })
        .where(eq(members.id, existing[0].id))
        .returning();
      return updated;
    }
    return existing[0];
  }
  const [inserted] = await db
    .insert(members)
    .values({ email: mail, name: name.trim() || mail, kind: "adult" })
    .returning();
  return inserted;
}

export async function ensureMembership(
  memberId: string,
  orgSlug: string,
  stance: string,
) {
  const db = getDb();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);
  if (!org) throw new Error(`Missing org ${orgSlug}`);
  const existing = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, org.id), eq(memberships.memberId, memberId)))
    .limit(1);
  if (existing[0]) {
    return { org, membership: existing[0] };
  }
  const [membership] = await db
    .insert(memberships)
    .values({ orgId: org.id, memberId, stance })
    .returning();
  return { org, membership };
}

/** Wave 1 helper. Does not auto-join household or sales. */
export async function ensureLearner(
  email: string,
  name: string,
  orgSlug = ORG0_SLUG,
): Promise<LearnerIdentity> {
  const member = await upsertMember(email, name);
  const stance = isStaffEmail(email) ? "admin" : "learner";
  const { org, membership } = await ensureMembership(member.id, orgSlug, stance);
  return {
    memberId: member.id,
    email: member.email,
    name: member.name,
    kind: member.kind ?? "adult",
    membershipId: membership.id,
    orgId: org.id,
    orgSlug: org.slug,
    orgIsolation: org.isolation,
    stance: membership.stance,
  };
}

export async function loadSession(request?: Request) {
  const user = await getAuthUser();
  if (!user) return null;
  await ensureTenantOrgs();
  const member = await upsertMember(user.email, user.name);
  const rows = await membershipsForMember(member.id);
  const requested = await requestedOrgSlug(request);
  const slug = pickActiveSlug(
    requested,
    rows.map((r) => r.orgSlug),
    member.kind ?? "adult",
  );
  const active = rows.find((r) => r.orgSlug === slug) ?? null;
  return { user, member, rows, requested, active };
}

export async function identityFromRequest(request?: Request): Promise<
  | { ok: true; identity: LearnerIdentity; memberships: Awaited<ReturnType<typeof membershipsForMember>> }
  | { ok: false; status: 401 | 403 | 404 | 503; error: string }
> {
  try {
    const session = await loadSession(request);
    if (!session) return { ok: false, status: 401, error: "sign_in_required" };
    const { member, rows, requested, active } = session;
    if (!rows.length) {
      return { ok: false, status: 403, error: "no_membership" };
    }
    if (!active) return { ok: false, status: 403, error: "forbidden_org" };
    if (requested && !rows.some((r) => r.orgSlug === requested)) {
      if (requested === "does-not-exist" || !(await orgExists(requested))) {
        return { ok: false, status: 404, error: "unknown_org" };
      }
      return { ok: false, status: 403, error: "forbidden_org" };
    }
    return {
      ok: true,
      memberships: rows,
      identity: {
        memberId: member.id,
        email: member.email,
        name: member.name,
        kind: member.kind ?? "adult",
        membershipId: active.membershipId,
        orgId: active.orgId,
        orgSlug: active.orgSlug,
        orgIsolation: active.isolation,
        stance: active.stance,
      },
    };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}

async function orgExists(slug: string) {
  const db = getDb();
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return Boolean(org);
}
