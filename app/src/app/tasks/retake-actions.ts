"use server";

import { and, eq } from "drizzle-orm";
import { assertCanAccessMember } from "@/lib/coaching/access";
import { canCoachOverride } from "@/lib/coaching/scores";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { retakeRequests } from "@/lib/db/schema";
import { loadTaskActor } from "@/app/api/coaching/tasks/session";
import { coachSeesRetake } from "./retake-policy";

export async function decideRetake(id: string, status: "approved" | "denied") {
  const blocked = requireCoachingWrite();
  if (blocked) return { ok: false as const, error: "writes_disabled" };

  if (status !== "approved" && status !== "denied") return { ok: false as const, error: "invalid_body" };
  const loaded = await loadTaskActor();
  if (!loaded.ok) return { ok: false as const, error: loaded.error };
  if (!canCoachOverride(loaded.world, loaded.actor)) return { ok: false as const, error: "forbidden" };
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(retakeRequests)
      .where(and(eq(retakeRequests.id, id), eq(retakeRequests.orgId, loaded.actor.orgId)))
      .limit(1);
    if (!row || row.status !== "open") return { ok: false as const, error: "not_found" };
    if (
      !coachSeesRetake({
        isCoach: true,
        actorMembershipId: loaded.actor.membershipId,
        requesterMembershipId: row.requesterMembershipId,
        canAccessRequester: Boolean(assertCanAccessMember(loaded.world, loaded.actor, row.requesterMembershipId)),
      })
    ) {
      return { ok: false as const, error: "forbidden" };
    }
    await db.update(retakeRequests).set({ status }).where(eq(retakeRequests.id, row.id));
    return { ok: true as const };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return { ok: false as const, error: "database_unavailable" };
    throw error;
  }
}
