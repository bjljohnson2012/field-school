import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffEmail } from "@/lib/auth/staff";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/members/policy";

export const ORG0_SLUG = "field-school";
export const HOUSEHOLD_SLUG = "household";

export type LearnerIdentity = {
  memberId: string;
  email: string;
  name: string;
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
  };
}

export async function ensureLearner(
  email: string,
  name: string,
  orgSlug = ORG0_SLUG,
): Promise<LearnerIdentity> {
  const db = getDb();
  const mail = normalizeEmail(email);
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);
  if (!org) {
    throw new Error(`Missing seed org ${orgSlug}`);
  }

  const existingMember = await db
    .select()
    .from(members)
    .where(eq(members.email, mail))
    .limit(1);
  let member = existingMember[0];
  if (!member) {
    const inserted = await db
      .insert(members)
      .values({ email: mail, name: name.trim() || mail })
      .returning();
    member = inserted[0];
  } else if (name.trim() && member.name !== name.trim()) {
    const updated = await db
      .update(members)
      .set({ name: name.trim() })
      .where(eq(members.id, member.id))
      .returning();
    member = updated[0] ?? member;
  }

  const stance = isStaffEmail(mail) ? "admin" : "learner";
  const existingMembership = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, org.id), eq(memberships.memberId, member.id)))
    .limit(1);
  let membership = existingMembership[0];
  if (!membership) {
    const inserted = await db
      .insert(memberships)
      .values({ orgId: org.id, memberId: member.id, stance })
      .returning();
    membership = inserted[0];
  }

  return {
    memberId: member.id,
    email: member.email,
    name: member.name,
    membershipId: membership.id,
    orgId: org.id,
    orgSlug: org.slug,
    orgIsolation: org.isolation,
    stance: membership.stance,
  };
}

export async function identityFromRequest(): Promise<
  | { ok: true; identity: LearnerIdentity }
  | { ok: false; status: 401 | 503; error: string }
> {
  const user = await getAuthUser();
  if (!user) return { ok: false, status: 401, error: "sign_in_required" };
  try {
    const identity = await ensureLearner(user.email, user.name);
    return { ok: true, identity };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}
