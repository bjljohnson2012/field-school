import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { memberships, organizations } from "@/lib/db/schema";
import { planRoomOrg } from "./orgs.ts";
import { applyTenancySqlIfConfigured } from "./sql.ts";

export async function ensureRoomOrg(
  member: { id: string; name: string },
  room: "family" | "team",
  opts?: { name?: string; homeschoolMode?: boolean },
) {
  await applyTenancySqlIfConfigured();
  const plan = planRoomOrg({
    memberId: member.id,
    memberName: member.name,
    room,
    name: opts?.name,
    homeschoolMode: opts?.homeschoolMode,
  });
  const db = getDb();
  const [existing] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, plan.slug))
    .limit(1);
  const org =
    existing ??
    (
      await db
        .insert(organizations)
        .values({
          slug: plan.slug,
          name: plan.name,
          kind: plan.kind,
          isolation: plan.isolation,
          homeschoolMode: plan.homeschoolMode,
          createdBy: plan.createdBy,
        })
        .returning()
    )[0];
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, org.id), eq(memberships.memberId, member.id)))
    .limit(1);
  if (!membership) {
    await db.insert(memberships).values({
      orgId: org.id,
      memberId: member.id,
      stance: plan.stance,
    });
  }
  return org;
}
