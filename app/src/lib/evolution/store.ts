/**
 * Drizzle adapter for the evolution write hook.
 * Updates living_profiles.profile for one org_id and membership_id.
 * Does not insert a login, a milestone, a media row, or a user_profiles row.
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { livingProfiles } from "@/lib/db/schema";
import { applyEvolutionWrite, type EvolutionDrop, type EvolutionStore, type ProfileRow } from "./write.ts";

type CampusDb = ReturnType<typeof getDb>;

export function drizzleEvolutionStore(db?: CampusDb): EvolutionStore {
  const handle = db ?? getDb();
  return {
    async load(orgId: string, membershipId: string): Promise<ProfileRow | null> {
      const [row] = await handle
        .select({
          orgId: livingProfiles.orgId,
          membershipId: livingProfiles.membershipId,
          kind: livingProfiles.kind,
          login: livingProfiles.login,
          profile: livingProfiles.profile,
        })
        .from(livingProfiles)
        .where(and(eq(livingProfiles.orgId, orgId), eq(livingProfiles.membershipId, membershipId)))
        .limit(1);
      return row ?? null;
    },
    async saveNote(orgId: string, membershipId: string, profile: string) {
      await handle
        .update(livingProfiles)
        .set({ profile, updatedAt: new Date() })
        .where(and(eq(livingProfiles.orgId, orgId), eq(livingProfiles.membershipId, membershipId)));
    },
  };
}

export async function writeEvolutionProfile(input: EvolutionDrop, db?: CampusDb) {
  return applyEvolutionWrite(input, drizzleEvolutionStore(db));
}
