import { recordAdultGate } from "@/lib/profile/store";
import { saveToolResult } from "@/lib/tools/results-store";
import type { Answer } from "./engine";
import { toolForGate, toolSubmissionFromRun } from "./tool-bridge";
import type { AdultGateId, TrackId } from "./tracks";

export type TrackCompletion = {
  owner: { memberId: string; name: string };
  track: TrackId;
  gate: AdultGateId;
  runId: string;
  completedAt: Date;
  answers: readonly Answer[];
};

/**
 * Finished Skills and Profile runs land on tool_results when every official
 * Tools item was answered, then on the same gate mark Tools Save writes.
 * Personality is not written here. A retry uses the run id, so the first row stays.
 */
export async function recordTrackGate(completion: TrackCompletion): Promise<void> {
  if (completion.gate === "G-personality") return;
  const tool = toolForGate(completion.gate);
  const submission = tool ? toolSubmissionFromRun(tool, completion.runId, completion.answers) : null;
  if (submission) await saveToolResult(completion.owner.memberId, submission, completion.completedAt);
  await recordAdultGate(completion.owner, completion.gate, completion.completedAt);
}
