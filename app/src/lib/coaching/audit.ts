import { getDb } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";

export async function writeCoachingAudit(entry: {
  orgId: string | null;
  actorMembershipId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const db = getDb();
  await db.insert(auditLogs).values({
    orgId: entry.orgId,
    actorMembershipId: entry.actorMembershipId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    metadata: entry.metadata ?? {},
  });
}
