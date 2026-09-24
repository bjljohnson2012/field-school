import { jsonError, loadTaskActor } from "@/app/api/coaching/tasks/session";
import type { Actor, CoachingWorld } from "@/lib/coaching/access";
import { canCoachOverride } from "@/lib/coaching/scores";

export function canManageLibrary(world: CoachingWorld, actor: Actor) {
  return canCoachOverride(world, actor);
}

export async function loadLibraryCoach(request?: Request) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return { ok: false as const, response: jsonError(loaded.error, loaded.status) };
  if (!canManageLibrary(loaded.world, loaded.actor)) {
    return { ok: false as const, response: jsonError("forbidden", 403) };
  }
  return loaded;
}
