import { completeJson, resolveModelFast } from "../client";

export const DRILL_PROMPT_AE = `You are a sales coach generating ONE realistic practice drill for an AE.

You'll receive: skill name, "what good looks like" rubric for THIS org, AE's role context,
and any prior drills already attempted today (avoid duplicates).

Generate a single specific buyer scenario or moment-in-deal that tests this exact skill.
The scenario should:
- Be 2-4 sentences setting context (who's in the room, what they just said)
- End with a clear ask: "What do you say next?" or "Write your discovery question." or "Respond to this objection."
- Be answerable in 2-5 sentences — not a multi-step roleplay

Output strict JSON:
{
  "scenario": "the 2-4 sentence buyer scenario + clear ask",
  "expectedBehaviors": ["3-5 specific things a strong response would do"],
  "trapBehaviors": ["2-3 specific things a weak response would do"]
}

Tie expectedBehaviors directly to the rubric. trapBehaviors should be common pitfalls for this skill.`;

export const DRILL_PROMPT_LEADER = `You are an executive coach generating ONE realistic practice drill for a sales LEADER (Director, VP).

The drill is about how the LEADER coaches their team — NOT about how they sell.
You'll receive: leadership skill name, "what good looks like" rubric for THIS org, leader role context,
and any prior drills already attempted today.

Generate a single specific situation between the leader and one of their AEs.
The situation should:
- Be 2-4 sentences setting context (which AE, what the AE did or said)
- End with a clear ask: "What do you say to your AE?" or "How do you frame the feedback?" or "Walk through your coaching move."
- Be answerable in 2-5 sentences

Output strict JSON:
{
  "scenario": "the 2-4 sentence team scenario + clear ask",
  "expectedBehaviors": ["3-5 specific things a strong leader's response would do"],
  "trapBehaviors": ["2-3 common leadership pitfalls"]
}

Focus on coaching, feedback, accountability, ritual-building — not closing deals.`;

export interface DrillPromptOutput {
  scenario: string;
  expectedBehaviors: string[];
  trapBehaviors: string[];
}

export async function generateDrillPrompt(input: {
  shape: "AE" | "LEADER";
  skillCategory: string;
  skillLabel: string;
  rubric: string;
  recentScenarios: string[];
  orgName: string;
}): Promise<DrillPromptOutput> {
  const parsed = await completeJson<DrillPromptOutput>({
    model: resolveModelFast(),
    system: input.shape === "LEADER" ? DRILL_PROMPT_LEADER : DRILL_PROMPT_AE,
    user: input,
    temperature: 0.8,
    jobId: "generateDrillPrompt",
  });
  return {
    scenario: parsed.scenario ?? "",
    expectedBehaviors: Array.isArray(parsed.expectedBehaviors) ? parsed.expectedBehaviors : [],
    trapBehaviors: Array.isArray(parsed.trapBehaviors) ? parsed.trapBehaviors : [],
  };
}

export const GRADER_PROMPT = `You are an expert sales coach grading ONE response to ONE drill.

You'll receive: scenario, expected behaviors, trap behaviors, the rubric, and the user's response.

Grade strictly:
- 90-100: hits all expected behaviors, avoids all traps, answer reads like the rubric
- 75-89: hits most expected behaviors, mostly avoids traps
- 60-74: hits some expected behaviors, falls into a minor trap
- 40-59: misses key behaviors or falls into a major trap
- 0-39: misses the point of the drill

Output strict JSON:
{
  "score": 0-100 integer,
  "summary": "1 sentence — what they did well + the one thing to fix",
  "didWell": ["2-4 specific strengths in their response"],
  "toImprove": ["1-3 specific improvements"],
  "improvedExample": "1-2 sentences showing how a 90+ response would phrase it"
}

Be encouraging but honest. The score must reflect the actual quality, not effort.`;

export interface GradeOutput {
  score: number;
  summary: string;
  didWell: string[];
  toImprove: string[];
  improvedExample: string;
}

export async function gradeDrillResponse(input: {
  scenario: string;
  expectedBehaviors: string[];
  trapBehaviors: string[];
  rubric: string;
  userResponse: string;
}): Promise<GradeOutput> {
  const parsed = await completeJson<GradeOutput>({
    model: resolveModelFast(),
    system: GRADER_PROMPT,
    user: input,
    temperature: 0.2,
    jobId: "gradeDrillResponse",
  });
  return {
    score: Math.max(0, Math.min(100, Math.round(parsed.score ?? 0))),
    summary: parsed.summary ?? "",
    didWell: Array.isArray(parsed.didWell) ? parsed.didWell : [],
    toImprove: Array.isArray(parsed.toImprove) ? parsed.toImprove : [],
    improvedExample: parsed.improvedExample ?? "",
  };
}
