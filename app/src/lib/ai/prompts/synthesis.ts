import { completeJson, resolveSynthModel } from "../client";

export interface SynthesizeInput {
  aeName: string;
  companyContext: {
    name: string;
    requiredSkills: Array<{ category: string; weight: number }>;
    products: Array<{ name: string; summary?: string }>;
    values: string[];
    salesMethodology?: string;
  };
  answers: Array<{
    category: string;
    tags: string[];
    questionText: string;
    questionType: string;
    value: unknown;
  }>;
}

export interface SynthesizedProfile {
  personalitySummary: string;
  salesStyleSummary: string;
  communicationSummary: string;
  motivations: string[];
  strengths: string[];
  weaknesses: string[];
  enneagramType?: string;
  discProfile?: string;
  mbtiType?: string;
  skillScores: Array<{
    category:
      | "DISCOVERY"
      | "OBJECTION_HANDLING"
      | "CLOSING"
      | "COMMUNICATION"
      | "RESILIENCE"
      | "PRODUCT_MASTERY";
    score: number;
    notes: string;
  }>;
}

export const SYNTHESIS_SYSTEM_PROMPT = `You are an expert sales coach analyzing an Account Executive's intake.

Output VALID JSON matching exactly this shape (use real content for every field, NOT placeholders):

{
  "personalitySummary": "2-4 sentence narrative of how they think, decide, connect.",
  "salesStyleSummary": "2-4 sentence narrative of how they sell — relationship, technical, consultative, etc.",
  "communicationSummary": "2-4 sentence narrative of communication preferences + style.",
  "motivations": ["3-5 short phrases naming what drives them"],
  "strengths": ["3-5 short phrases — observable strengths"],
  "weaknesses": ["3-5 short phrases — growth areas, honest"],
  "enneagramType": "1-9 (or 1w2 / 7w8 etc. with wing)",
  "discProfile": "D, I, S, C, or combo like DC",
  "mbtiType": "ENTJ, INFP, etc.",
  "skillScores": [
    {"category": "DISCOVERY", "score": 55, "notes": "1 sentence on where they are."},
    {"category": "OBJECTION_HANDLING", "score": 60, "notes": "..."},
    {"category": "CLOSING", "score": 50, "notes": "..."},
    {"category": "COMMUNICATION", "score": 65, "notes": "..."},
    {"category": "RESILIENCE", "score": 55, "notes": "..."},
    {"category": "PRODUCT_MASTERY", "score": 45, "notes": "..."}
  ]
}

Hard rules:
- EVERY field must be filled — no nulls, no empty strings, no empty arrays.
- All six skillScores entries are required.
- Score conservatively for new AEs; most should land 40–65.
- If skillRubrics is present in the user payload, USE EACH RUBRIC as the 100-level benchmark for that skill. The whatGoodLooksLike string defines what a 90+ AE looks like for THIS org — score relative to that bar, not against a generic industry default.`;

export async function synthesizeProfile(
  input: SynthesizeInput,
  opts: { skillRubrics?: Record<string, string>; aiModel?: string | null } = {},
): Promise<SynthesizedProfile> {
  const userPayload =
    opts.skillRubrics && Object.keys(opts.skillRubrics).length > 0
      ? { ...input, skillRubrics: opts.skillRubrics }
      : input;
  return completeJson({
    model: resolveSynthModel(opts.aiModel),
    system: SYNTHESIS_SYSTEM_PROMPT,
    user: userPayload,
    temperature: 0.3,
    jobId: "synthesizeProfile",
  });
}

export interface DirectorSynthesizeInput {
  directorName: string;
  companyContext: { name: string; salesMethodology?: string };
  answers: SynthesizeInput["answers"];
}

export interface DirectorSynthesizedProfile {
  personalitySummary: string;
  leadershipSummary: string;
  forecastingSummary: string;
  motivations: string[];
  strengths: string[];
  weaknesses: string[];
  enneagramType?: string;
  discProfile?: string;
  mbtiType?: string;
  skillScores: Array<{
    category: "LEADERSHIP" | "FORECASTING" | "COMMUNICATION" | "RESILIENCE";
    score: number;
    notes: string;
  }>;
}

export const DIRECTOR_SYSTEM_PROMPT = `You are an executive coach analyzing a Sales Director's intake.

Output VALID JSON matching exactly this shape (use real content for every field, NOT placeholders):

{
  "personalitySummary": "2-4 sentence narrative of how they think, decide, connect.",
  "leadershipSummary": "2-4 sentence narrative of their leadership style — how they coach, hold accountability, build team rituals.",
  "forecastingSummary": "2-4 sentence narrative of how they call deals, run forecast meetings, manage uncertainty.",
  "motivations": ["3-5 short phrases naming what drives them as a leader"],
  "strengths": ["3-5 short phrases — observable leadership strengths"],
  "weaknesses": ["3-5 short phrases — leadership growth areas, honest"],
  "enneagramType": "1-9 (or 1w2 / 7w8 etc. with wing)",
  "discProfile": "D, I, S, C, or combo like DC",
  "mbtiType": "ENTJ, INFP, etc.",
  "skillScores": [
    {"category": "LEADERSHIP", "score": 60, "notes": "1 sentence on where they are as a coach + accountability holder."},
    {"category": "FORECASTING", "score": 55, "notes": "1 sentence on forecast accuracy + discipline."},
    {"category": "COMMUNICATION", "score": 65, "notes": "1 sentence on clarity + presence."},
    {"category": "RESILIENCE", "score": 55, "notes": "1 sentence on grit + composure under pressure."}
  ]
}

Hard rules:
- EVERY field must be filled — no nulls, no empty strings, no empty arrays.
- All four skillScores entries are required.
- Score conservatively. Most directors should land 50–70 — leadership skills are hard.
- Be honest about growth areas — directors get coached too.
- If skillRubrics is present in the user payload, USE EACH RUBRIC as the 100-level benchmark for that leadership skill. The whatGoodLooksLike string defines what a 90+ leader looks like for THIS org — score relative to that bar.`;

export async function synthesizeDirectorProfile(
  input: DirectorSynthesizeInput,
  opts: { skillRubrics?: Record<string, string>; aiModel?: string | null } = {},
): Promise<DirectorSynthesizedProfile> {
  const userPayload =
    opts.skillRubrics && Object.keys(opts.skillRubrics).length > 0
      ? { ...input, skillRubrics: opts.skillRubrics }
      : input;
  return completeJson({
    model: resolveSynthModel(opts.aiModel),
    system: DIRECTOR_SYSTEM_PROMPT,
    user: userPayload,
    temperature: 0.3,
    jobId: "synthesizeDirectorProfile",
  });
}
