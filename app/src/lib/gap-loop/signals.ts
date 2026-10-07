export type OutcomeSignalInput = {
  title: string;
  requirements: readonly { label: string; status: string; coverage: number; systemConfidence: "Low" | "Medium" | "High" }[];
  topGap: string | null;
  intentLinked: boolean;
};

export const WRITES_PARENT_CONFIDENCE = false;

/**
 * Family v1 shape for one outcome.
 * `confidence` stays null. The loop asks for a rating and never writes parent Confidence.
 */
export function outcomeSignals(input: OutcomeSignalInput) {
  const total = input.requirements.length;
  const done = input.requirements.filter((row) => row.status === "met" || row.status === "waived").length;
  const average = total
    ? Math.round(input.requirements.reduce((sum, row) => sum + row.coverage, 0) / total)
    : 0;
  const highs = input.requirements.filter((row) => row.systemConfidence === "High").length;
  const systemConfidence = highs >= 2 ? "High" : average >= 60 ? "Medium" : "Low";
  return {
    now: {
      copy: total ? `${done} of ${total} requirements met for ${input.title}.` : `No requirements yet for ${input.title}.`,
      coverage: { done, total },
      coverageLabel: total ? `${done} of ${total} requirements` : "No requirements yet",
      intentMatch: input.intentLinked ? "This goal links a saved intent." : "This goal has no linked intent.",
    },
    confidence: null,
    systemConfidence,
    writesParentConfidence: WRITES_PARENT_CONFIDENCE,
    next: {
      title: input.topGap || "",
      reason: input.topGap ? "Suggested from the top gap. You still lock the portion." : "",
      locked: false,
      items: input.topGap ? [{ title: input.topGap, subject: "" }] : [],
      empty: !input.topGap,
    },
  };
}
