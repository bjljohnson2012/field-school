import { recordAdultGate } from "@/lib/profile/store";
import type { AdultGateId, TrackId } from "./tracks";

export type TrackCompletion = {
  owner: { memberId: string; name: string };
  track: TrackId;
  gate: AdultGateId;
  runId: string;
  completedAt: Date;
};

/**
 * Where a finished Skills or Profile run sets gate freshness. Stream 1 owns Tools persist
 * (`tool_results`, PR 343, not on main); when it lands, this is the one place to rebind.
 * Today it writes the same M1 gate mark Tools Save writes. Personality is not written here:
 * G-personality stays derived from runs, the way M1 derives it from Field Pattern.
 * Writing with the run's completedAt makes a retry land on the same mark.
 */
export async function recordTrackGate(completion: TrackCompletion): Promise<void> {
  if (completion.gate === "G-personality") return;
  await recordAdultGate(completion.owner, completion.gate, completion.completedAt);
}
