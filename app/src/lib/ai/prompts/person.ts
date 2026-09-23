import { completeJson, resolveModelFast } from "../client";

export interface CoachingHintsInput {
  name: string;
  role?: "AE" | "DIRECTOR";
  enneagramType?: string | null;
  discProfile?: string | null;
  mbtiType?: string | null;
  personalitySummary?: string | null;
  salesStyleSummary?: string | null;
  leadershipSummary?: string | null;
  communicationSummary?: string | null;
  strengths: string[];
  weaknesses: string[];
  motivations: string[];
  skillScores: Array<{ category: string; score: number }>;
  recentNotes?: Array<{ date: string; content: string }>;
  recentReviewSummaries?: string[];
}

export interface CoachingHintsOutput {
  personality: string[];
  salesStyle: string[];
  communication: string[];
  motivations: string[];
  strengths: string[];
  weaknesses: string[];
  reasoningSummary: string;
}

const COACHING_HINTS_PROMPT = `You are an elite coaching strategist generating two outputs for the leader of a specific direct report.

OUTPUT 1 — coaching hints (leader-only). For each of 6 fields, 3-5 short hints (1 sentence each):
  - personality (how to communicate, what to expect)
  - salesStyle (how to coach their selling — or leadership for directors)
  - communication (cadence + tone preferences)
  - motivations (what to lean on for engagement)
  - strengths (how to amplify)
  - weaknesses (how to coach growth without crushing them)

OUTPUT 2 — reasoningSummary. A 4-7 sentence holistic narrative explaining HOW you (the AI) think about this person. Tie together personality stack + skill profile + recent notes/reviews/preps + motivations into a unified read. Use markdown (paragraphs, **bold**, bullets). This is "the AI's mental model of this person" — useful for the leader to scan in 30 seconds before any 1:1.

Hints should reference SPECIFIC traits — DISC type, Enneagram type, MBTI, skill scores, named strengths/weaknesses. Avoid generic coaching advice.

Personality nuance matters:
  - Healthy Type 9 (peacemaker) is centered + decisive; unhealthy Type 9 disappears under pressure. Tailor accordingly based on signals.
  - Healthy Type 8 leads with controlled intensity; unhealthy Type 8 dominates and bulldozes.
  - Read recentNotes + recent prep summaries for cues about which version of this person you're dealing with right now.

Tone: direct, practical, no fluff. Hints are things a leader could DO this week.

Output strict JSON:
{
  "personality": [...],
  "salesStyle": [...],
  "communication": [...],
  "motivations": [...],
  "strengths": [...],
  "weaknesses": [...],
  "reasoningSummary": "..."
}`;

export async function generateCoachingHints(
  input: CoachingHintsInput,
  _modelOverride?: string | null,
): Promise<CoachingHintsOutput> {
  const parsed = await completeJson<Partial<CoachingHintsOutput>>({
    model: resolveModelFast(),
    system: COACHING_HINTS_PROMPT,
    user: input,
    temperature: 0.4,
    jobId: "generateCoachingHints",
  });
  return {
    personality: Array.isArray(parsed.personality) ? parsed.personality : [],
    salesStyle: Array.isArray(parsed.salesStyle) ? parsed.salesStyle : [],
    communication: Array.isArray(parsed.communication) ? parsed.communication : [],
    motivations: Array.isArray(parsed.motivations) ? parsed.motivations : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    reasoningSummary: typeof parsed.reasoningSummary === "string" ? parsed.reasoningSummary : "",
  };
}

export interface PersonalitySide {
  name: string;
  role: "AE" | "DIRECTOR" | "COMPANY_ADMIN" | "ORG_ADMIN" | "VP_SALES";
  enneagramType?: string | null;
  discProfile?: string | null;
  mbtiType?: string | null;
  personalitySummary?: string | null;
  styleSummary?: string | null;
  communicationSummary?: string | null;
  strengths: string[];
  weaknesses: string[];
  motivations: string[];
  skillScores: Array<{ category: string; score: number }>;
}

export interface PersonalityCompareInput {
  leader: PersonalitySide;
  target: PersonalitySide;
}

export interface PersonalityCompareOutput {
  summary: string;
  alignedAreas: string[];
  frictionPoints: string[];
  adjustments: {
    personality: string[];
    style: string[];
    communication: string[];
    motivations: string[];
    strengths: string[];
    weaknesses: string[];
  };
}

const PERSONALITY_COMPARE_PROMPT = `You are an elite coaching strategist comparing how a LEADER naturally works against the TARGET person they coach.

Goal: help the leader see what THEY need to flex about their own style to coach this person effectively. Frame everything from the leader's perspective — "what you need to do differently."

Output strict JSON:
{
  "summary": "2-3 sentences on natural friction or alignment between the two styles",
  "alignedAreas": ["where the leader's natural style serves this target..."],
  "frictionPoints": ["where the leader's instincts might miss this target..."],
  "adjustments": {
    "personality": ["specific behavioral flexes — 2-4 items"],
    "style": ["sales/leadership-style flexes — 2-4 items"],
    "communication": ["communication-cadence/tone flexes — 2-4 items"],
    "motivations": ["how to engage their motivators differently — 2-4 items"],
    "strengths": ["how to amplify their strengths given your style — 2-4 items"],
    "weaknesses": ["how to coach growth without imposing your patterns — 2-4 items"]
  }
}

Be specific. Reference DISC types, Enneagram types, MBTI letters by name. If the leader is a high-D (driver) coaching a high-S (steady), call that out and tell them what to slow down on. If the leader is Type-3 Achiever coaching a Type-9 Peacemaker, name the friction.

Tone: direct, no fluff. Each item is something the leader could DO this week.`;

export async function generatePersonalityComparison(
  input: PersonalityCompareInput,
): Promise<PersonalityCompareOutput> {
  const parsed = await completeJson<Partial<PersonalityCompareOutput>>({
    model: resolveModelFast(),
    system: PERSONALITY_COMPARE_PROMPT,
    user: input,
    temperature: 0.4,
    jobId: "generatePersonalityComparison",
  });
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    alignedAreas: Array.isArray(parsed.alignedAreas) ? parsed.alignedAreas : [],
    frictionPoints: Array.isArray(parsed.frictionPoints) ? parsed.frictionPoints : [],
    adjustments: {
      personality: Array.isArray(parsed.adjustments?.personality) ? parsed.adjustments.personality : [],
      style: Array.isArray(parsed.adjustments?.style) ? parsed.adjustments.style : [],
      communication: Array.isArray(parsed.adjustments?.communication) ? parsed.adjustments.communication : [],
      motivations: Array.isArray(parsed.adjustments?.motivations) ? parsed.adjustments.motivations : [],
      strengths: Array.isArray(parsed.adjustments?.strengths) ? parsed.adjustments.strengths : [],
      weaknesses: Array.isArray(parsed.adjustments?.weaknesses) ? parsed.adjustments.weaknesses : [],
    },
  };
}
