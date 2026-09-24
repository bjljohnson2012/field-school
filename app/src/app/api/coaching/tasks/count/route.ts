import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { assertCanAccessMember } from "@/lib/coaching/access";
import { canCoachOverride } from "@/lib/coaching/scores";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { retakeRequests, workItems } from "@/lib/db/schema";
import { coachSeesRetake, tasksBadgeCount } from "@/app/tasks/retake-policy";
import { countOpenTasks } from "../persist";
import { jsonError, loadTaskActor } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  try {
    const openWorkItems = await countOpenTasks(loaded.actor.orgId, loaded.actor.membershipId);
    const db = getDb();
    const held = await db
      .select({ id: workItems.id })
      .from(workItems)
      .where(
        and(
          eq(workItems.orgId, loaded.actor.orgId),
          or(
            eq(workItems.assigneeMembershipId, loaded.actor.membershipId),
            eq(workItems.authorMembershipId, loaded.actor.membershipId),
          ),
        ),
      );
    const isCoach = canCoachOverride(loaded.world, loaded.actor);
    let openRetakes = 0;
    if (isCoach && held.length > 0) {
      const rows = await db
        .select({
          requesterMembershipId: retakeRequests.requesterMembershipId,
        })
        .from(retakeRequests)
        .where(and(eq(retakeRequests.orgId, loaded.actor.orgId), eq(retakeRequests.status, "open")));
      openRetakes = rows.filter((row) =>
        coachSeesRetake({
          isCoach: true,
          actorMembershipId: loaded.actor.membershipId,
          requesterMembershipId: row.requesterMembershipId,
          canAccessRequester: Boolean(assertCanAccessMember(loaded.world, loaded.actor, row.requesterMembershipId)),
        }),
      ).length;
    }
    const count = tasksBadgeCount({
      openWorkItems,
      hasWorkItems: held.length > 0,
      isCoach,
      openRetakes,
    });
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
