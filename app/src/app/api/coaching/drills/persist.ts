import { recordEvent } from "@/lib/campus-runtime/events";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { getDb } from "@/lib/db/client";
import { drillAttempts } from "@/lib/db/schema";
import type { DrillAttemptRow, DrillEventWrite, DrillSubject } from "./write";

export async function insertDrillAttempt(row: DrillAttemptRow) {
  const db = getDb();
  const [saved] = await db.insert(drillAttempts).values(row).returning({ id: drillAttempts.id });
  if (!saved) throw new Error("drill_insert_failed");
  return saved;
}

export async function recordSubjectDrill(
  subject: DrillSubject,
  event: DrillEventWrite,
  actor: { membershipId: string; stance: string },
) {
  return recordEvent(
    subject as LearnerIdentity,
    {
      kind: event.kind,
      objectType: event.objectType,
      objectId: event.objectId,
      score: event.score,
      raw: event.raw,
    },
    { membershipId: actor.membershipId, stance: actor.stance },
  );
}
