import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffEmail } from "@/lib/auth/staff";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/members/policy";
import { syncFamilyMode } from "@/lib/intent/family-mode";
import { applyTenancySqlIfConfigured } from "@/lib/tenancy/sql";
import { loginAllowed } from "@/lib/tenancy/access";
import { ensureRoomOrg } from "@/lib/tenancy/store";
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
  mode: string;
  membershipId: string;
  orgId: string;
  orgSlug: string;
  orgKind: string;
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
  await applyTenancySqlIfConfigured();
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

function toLearnerIdentity(
  member: { id: string; email: string; name: string; kind: string | null; mode: string | null },
  org: { id: string; slug: string; kind: string; isolation: string },
  membership: { id: string; stance: string },
): LearnerIdentity {
  return {
    memberId: member.id,
    email: member.email,
    name: member.name,
    kind: member.kind ?? "adult",
    mode: member.mode ?? "none",
    membershipId: membership.id,
    orgId: org.id,
    orgSlug: org.slug,
    orgKind: org.kind,
    orgIsolation: org.isolation,
    stance: membership.stance,
  };
}

export async function ensureLearner(
  email: string,
  name: string,
  orgSlug?: string,
): Promise<LearnerIdentity> {
  const member = await upsertMember(email, name);
  if (!loginAllowed(member)) throw new Error("login_none");
  const requested = orgSlug?.trim() || "";
  if (!requested) {
    const created = await ensureRoomOrg({ id: member.id, name: member.name }, "family");
    const { org, membership } = await ensureMembership(member.id, created.slug, "owner");
    return toLearnerIdentity(member, org, membership);
  }
  const stance = isStaffEmail(email) ? "admin" : "learner";
  const { org, membership } = await ensureMembership(member.id, requested, stance);
  return toLearnerIdentity(member, org, membership);
}

export async function loadSession(request?: Request) {
  const user = await getAuthUser();
  if (!user) return null;
  await ensureTenantOrgs();
  const member = await upsertMember(user.email, user.name);
  if (!loginAllowed(member)) return null;
  let rows = await membershipsForMember(member.id);
  const staff = isStaffEmail(user.email);
  if (staff) {
    await ensureMembership(member.id, ORG0_SLUG, "admin");
    await ensureMembership(member.id, HOUSEHOLD_SLUG, "guardian");
    await ensureMembership(member.id, SALES_SLUG, "trainer");
    rows = await membershipsForMember(member.id);
  } else if (rows.length === 0) {
    await ensureRoomOrg({ id: member.id, name: member.name }, "family");
    rows = await membershipsForMember(member.id);
  }
  const requested = await requestedOrgSlug(request);
  const slug = pickActiveSlug(
    requested,
    rows.map((r) => r.orgSlug),
    member.kind ?? "adult",
    staff,
  );
  const active = rows.find((r) => r.orgSlug === slug) ?? null;
  const synced = await syncFamilyMode(member);
  return { user, member: synced, rows, requested, active };
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
    if (!active || !active.orgId || !active.membershipId) {
      return { ok: false, status: 403, error: "no_membership" };
    }
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
        mode: member.mode ?? "none",
        membershipId: active.membershipId,
        orgId: active.orgId,
        orgSlug: active.orgSlug,
        orgKind: active.orgKind,
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
