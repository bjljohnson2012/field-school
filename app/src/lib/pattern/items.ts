export const INSTRUMENT_SLUG = "fp-50-v1";

export const BEARING_DIMS = [
  "drive",
  "harmony",
  "structure",
  "pace",
  "abstraction",
  "challenge",
  "duty",
  "expression",
] as const;
export type BearingDim = (typeof BEARING_DIMS)[number];
export type Weights = Partial<Record<BearingDim, number>>;

export type InstrumentItem = {
  n: number;
  key: string;
  prompt: string;
  weights: Weights;
  child: boolean;
};

const I = (
  n: number,
  prompt: string,
  weights: Weights,
  child = false,
): InstrumentItem => ({
  n,
  key: `fp50-${String(n).padStart(2, "0")}`,
  prompt,
  weights,
  child,
});

/** Official fp-50-v1 item table. Weights are on Bearing dimensions. */
export const FP50_ITEMS: InstrumentItem[] = [
  I(1, "I would rather start the work than keep planning it.", { drive: 2, pace: 1 }, true),
  I(2, "I feel responsible for how other people in the room are doing.", { harmony: 2, duty: 1 }, true),
  I(3, "A checklist makes me calmer, not boxed in.", { structure: 2, duty: 1 }, true),
  I(4, "I do my best thinking in short bursts, then I need to walk away.", { pace: 2 }, true),
  I(5, "I want the model before the example.", { abstraction: 2 }),
  I(6, "Disagreement does not ruin my day.", { challenge: 2 }),
  I(7, "If I said I would do it, I will do it even when no one checks.", { structure: 1, duty: 2 }, true),
  I(8, "I figure things out by talking them through out loud.", { expression: 2 }, true),
  I(9, "Waiting for consensus makes me restless.", { drive: 2, pace: 1, challenge: 1 }),
  I(10, "I will soften a true sentence so it does not land hard.", { harmony: 2, expression: 1 }, true),
  I(11, "I finish the last 10% instead of jumping to the next idea.", { structure: 2, duty: 1 }, true),
  I(12, "A 45-minute lesson with no break loses me.", { pace: 2 }, true),
  I(13, "I like mapping the whole system on paper before I touch the task.", { structure: 1, abstraction: 2 }),
  I(14, "I will say the uncomfortable thing in the meeting.", { drive: 1, challenge: 2, expression: 1 }),
  I(15, "A missed standard bothers me more than a missed compliment.", { duty: 2 }),
  I(16, "I would rather write a page than talk for ten minutes.", { expression: -2 }, true),
  I(17, "I volunteer to go first.", { drive: 2, challenge: 1, expression: 1 }, true),
  I(18, "I notice who has not spoken yet.", { harmony: 2 }, true),
  I(19, "I want the steps in order before I start.", { structure: 2 }, true),
  I(20, "I can sit with one problem for a long afternoon.", { structure: 1, pace: -2, abstraction: 1 }),
  I(21, "Concrete examples teach me faster than principles.", { abstraction: -2 }, true),
  I(22, "A tense conversation is information, not a fire.", { challenge: 2 }),
  I(23, "I keep score with myself more than with other people.", { duty: 2 }),
  I(24, "After I learn something, I want to explain it to someone.", { harmony: 1, expression: 2 }, true),
  I(25, "I get impatient when a decision sits unsigned.", { drive: 2, pace: 1, challenge: 1 }),
  I(26, "I replay a sharp comment later even if the work is fine.", { harmony: 2, challenge: -1 }, true),
  I(27, "I like knowing what done looks like before I begin.", { structure: 2, duty: 1 }, true),
  I(28, "Two short sessions beat one long one.", { pace: 2 }, true),
  I(29, "I enjoy an argument about how the pieces fit.", { abstraction: 2, challenge: 1, expression: 1 }),
  I(30, "I would rather hear hard feedback in the room than in an email the next day.", { drive: 1, challenge: 2, expression: 1 }),
  I(31, "Leaving work half-finished overnight bothers me.", { structure: 1, duty: 2 }),
  I(32, "Silence while I think is comfortable.", { expression: -2 }, true),
  I(33, "I push for a next step before the meeting ends.", { drive: 2, structure: 1, challenge: 1 }),
  I(34, "I will change my wording if I see someone shut down.", { harmony: 2, expression: 1 }, true),
  I(35, "I keep my notes in a place I can find next week.", { structure: 2, duty: 1 }),
  I(36, "I want to move on once I understand the idea, even if practice remains.", { drive: 1, structure: -1, pace: 2 }),
  I(37, "A story teaches me less than a diagram.", { abstraction: 2 }),
  I(38, "I can stay in a disagreement without needing to win it today.", { harmony: 1, challenge: 2 }),
  I(39, "I do the unglamorous part because it is the part that is required.", { structure: 1, duty: 2 }),
  I(40, "I draft out loud, then clean it up.", { pace: 1, expression: 2 }),
  I(41, "If no one leads, I will.", { drive: 2, challenge: 1 }),
  I(42, "I would rather be liked in the room than be right in the room.", { harmony: 2, challenge: -1 }),
  I(43, "I break a big job into named pieces before I touch the first one.", { structure: 2, abstraction: 1 }),
  I(44, "I lose the thread when a lesson keeps going after I have the point.", { pace: 2 }),
  I(45, "I ask what is the rule here before I ask what is an example.", { abstraction: 2 }),
  I(46, "I will take the other side in a practice argument to test the idea.", { drive: 1, abstraction: 1, challenge: 2, expression: 1 }),
  I(47, "I feel off if I skipped a commitment I made to myself.", { duty: 2 }),
  I(48, "I learn faster when I have to teach it back in a sentence.", { expression: 2 }),
  I(49, "Speed matters more to me than polish on the first pass.", { drive: 2, structure: -1, pace: 1 }),
  I(50, "I would rather get written notes I can reread than a live debrief.", { structure: 1, challenge: -1, expression: -2 }),
];

export function itemsForSubset(subset: "adult" | "child") {
  return subset === "child" ? FP50_ITEMS.filter((item) => item.child) : FP50_ITEMS;
}

export function primaryDim(weights: Weights): BearingDim {
  let best: BearingDim = "drive";
  let mag = -1;
  for (const dim of BEARING_DIMS) {
    const abs = Math.abs(weights[dim] ?? 0);
    if (abs > mag) {
      mag = abs;
      best = dim;
    }
  }
  return best;
}
