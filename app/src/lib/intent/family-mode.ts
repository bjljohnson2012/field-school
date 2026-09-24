import { and, eq, ne } from "drizzle-orm";
import { HOUSEHOLD_SLUG } from "@/lib/campus-runtime/rules";
import { getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";
import { FAMILY_MODE } from "./rules";

export function featureMode(features: unknown) {
  if (!features || typeof features !== "object" || Array.isArray(features)) return "";
  const mode = (features as { mode?: unknown }).mode;
  return typeof mode === "string" ? mode : "";
}

export async function syncFamilyMode<T extends {
  id: string;
  kind: string;
  mode?: string | null;
}>(member: T) {
  const current = member.mode ?? "none";
  if ((member.kind ?? "adult") === "child") {
    return { ...member, mode: current };
  }
  if (current === FAMILY_MODE) {
    return { ...member, mode: FAMILY_MODE };
  }
  const db = getDb();
  const rows = await db
    .select({ stance: memberships.stance })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(
      and(eq(memberships.memberId, member.id), eq(organizations.slug, HOUSEHOLD_SLUG)),
    );
  const isGuardian = rows.some((row) => row.stance === "guardian" || row.stance === "admin");
  if (!isGuardian) {
    return { ...member, mode: current };
  }
  const [updated] = await db
    .update(members)
    .set({ mode: FAMILY_MODE })
    .where(and(eq(members.id, member.id), ne(members.kind, "child")))
    .returning();
  return updated ?? { ...member, mode: FAMILY_MODE };
}
