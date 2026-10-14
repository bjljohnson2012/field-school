/**
 * Campus adapter for the evolution write hook.
 * M15 retired the living-brain profile table. This adapter does not query it.
 * It does not insert a login, a milestone, a media row, or a user_profiles row.
 */

import { applyEvolutionWrite, type EvolutionDrop, type EvolutionStore, type ProfileRow } from "./write.ts";

export function drizzleEvolutionStore(): EvolutionStore {
  return {
    async load(): Promise<ProfileRow | null> {
      return null;
    },
    async saveNote() {},
  };
}

export async function writeEvolutionProfile(input: EvolutionDrop) {
  return applyEvolutionWrite(input, drizzleEvolutionStore());
}
