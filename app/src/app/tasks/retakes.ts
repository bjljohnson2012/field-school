import { and, desc, eq } from "drizzle-orm";
import { assertCanAccessMember, type Actor, type CoachingWorld } from "@/lib/coaching/access";
import { canCoachOverride } from "@/lib/coaching/scores";
import { getDb } from "@/lib/db/client";
import { members, memberships, retakeRequests } from "@/lib/db/schema";
import { coachSeesRetake } from "./retake-policy";

export type CoachRetake = {
  id: string;
  requesterName: string;
  status: string;
  createdAt: string;
};

export async function loadCoachRetakes(world: CoachingWorld, actor: Actor) {
  const isCoach = canCoachOverride(world, actor);
  if (!isCoach) return { isCoach: false, requests: [] as CoachRetake[] };
  const db = getDb();
  const rows = await db
    .select()
    .from(retakeRequests)
    .where(and(eq(retakeRequests.orgId, actor.orgId), eq(retakeRequests.status, "open")))
    .orderBy(desc(retakeRequests.createdAt));
  const visible = rows.filter((row) =>
    coachSeesRetake({
      isCoach: true,
      actorMembershipId: actor.membershipId,
      requesterMembershipId: row.requesterMembershipId,
      canAccessRequester: Boolean(assertCanAccessMember(world, actor, row.requesterMembershipId)),
    }),
  );
  const people = await db
    .select({ id: memberships.id, name: members.name })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(eq(memberships.orgId, actor.orgId));
  const names = new Map(people.map((row) => [row.id, row.name]));
  return {
    isCoach: true,
    requests: visible.map((row) => ({
      id: row.id,
      requesterName: names.get(row.requesterMembershipId) || "Member",
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
