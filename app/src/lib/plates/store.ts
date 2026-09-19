import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { plateRenders } from "@/lib/db/schema";
import { decidePlate, destAllowed, plateVisibleTo } from "./rules";

export async function listPlates(identity: LearnerIdentity) {
  const db = getDb();
  const rows = await db
    .select()
    .from(plateRenders)
    .where(eq(plateRenders.orgId, identity.orgId))
    .orderBy(desc(plateRenders.createdAt));
  return rows.filter((row) =>
    plateVisibleTo({ orgId: row.orgId, status: row.status }, identity),
  );
}

export async function registerPlate(
  identity: LearnerIdentity,
  input: { composition: string; dest: string; sha256?: string; checklistVerdict?: string },
) {
  const composition = input.composition.trim();
  const dest = input.dest.trim();
  if (!composition) return { error: "composition_required" as const };
  if (!destAllowed(dest)) return { error: "locked_dest" as const };
  const db = getDb();
  const [row] = await db
    .insert(plateRenders)
    .values({
      orgId: identity.orgId,
      membershipId: identity.membershipId,
      composition,
      dest,
      sha256: input.sha256?.trim() || "",
      status: "pending",
      checklistVerdict: input.checklistVerdict?.trim() || "",
      holdCleaning: true,
    })
    .returning();
  return { plate: row };
}

export async function decidePlateRow(
  identity: LearnerIdentity,
  plateId: string,
  action: "approve" | "reject",
) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(plateRenders)
    .where(and(eq(plateRenders.id, plateId), eq(plateRenders.orgId, identity.orgId)))
    .limit(1);
  if (!row) return { error: "unknown_plate" as const };
  const decided = decidePlate(row.status, action);
  if (!decided.ok) return { error: decided.error };
  const [updated] = await db
    .update(plateRenders)
    .set({ status: decided.status, decidedAt: new Date() })
    .where(and(eq(plateRenders.id, row.id), eq(plateRenders.orgId, identity.orgId)))
    .returning();
  return { plate: updated };
}
