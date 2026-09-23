import { completeJson, forceCoachRoute, resolveModelFast, resolveSynthModel } from "../client";

export interface CrossRefInput {
  aeProfile: {
    name: string;
    personalitySummary?: string | null;
    salesStyleSummary?: string | null;
    communicationSummary?: string | null;
    strengths: string[];
    weaknesses: string[];
    skillScores: Array<{ category: string; score: number }>;
  };
  prepDoc: { weekOf: string; title?: string | null; content: string };
  companyContext: { name: string; salesMethodology?: string | null };
}

export interface CrossRefOutput {
  talkingPoints: Array<{ point: string; rationale: string; tieToWeakness?: string }>;
  recommendations: Array<{
    title: string;
    description: string;
    category?: string;
    routeTo?: "learner" | "coach";
    route_to?: "learner" | "coach";
  }>;
}

const CROSS_REF_SYSTEM_PROMPT = `You are a sales coach preparing a director for a 1:1.
Given the AE's profile and weekly prep doc, generate 3-5 specific coaching talking points and 1-3 recommendations.
Tag each recommendation with category (SALES_SKILL | PRODUCT_KNOWLEDGE | PERSONALITY | LEADERSHIP | GENERAL) and routeTo (learner | coach).
PERSONALITY and LEADERSHIP recommendations MUST always have routeTo = "coach".
Output JSON: {"talkingPoints": [...], "recommendations": [...]}`;

export async function crossReferencePrepDoc(
  input: CrossRefInput,
  modelOverride?: string | null,
): Promise<CrossRefOutput> {
  const parsed = await completeJson<CrossRefOutput>({
    model: resolveSynthModel(modelOverride),
    system: CROSS_REF_SYSTEM_PROMPT,
    user: input,
    temperature: 0.4,
    jobId: "crossReferencePrepDoc",
  });
  return {
    ...parsed,
    recommendations: (parsed.recommendations ?? []).map((rec) => forceCoachRoute(rec)),
  };
}

export interface OneOnOnePrepInput {
  aeProfile: {
    name: string;
    role?: "AE" | "DIRECTOR";
    personalitySummary?: string | null;
    salesStyleSummary?: string | null;
    leadershipSummary?: string | null;
    forecastingSummary?: string | null;
    communicationSummary?: string | null;
    enneagramType?: string | null;
    discProfile?: string | null;
    mbtiType?: string | null;
    strengths: string[];
    weaknesses: string[];
    skillScores: Array<{ category: string; score: number }>;
    motivations: string[];
  };
  recentNotes?: Array<{ date: string; content: string }>;
  recentReviews?: Array<{ monthOf: string; summary?: string | null }>;
  prepDocText: string;
  productNames?: string[];
  teamRoster?: Array<{ name: string; topStrength?: string; topGap?: string; lastQuotaPct?: number | null }>;
}

export interface OneOnOnePrepSection {
  title: string;
  bringUp: string;
  howToBringIt: string;
  questions: string[];
  tieToSkill?: string;
  tieToProduct?: string;
  tieToPersonality?: string;
}

export interface OneOnOnePrepOutput {
  summary: string;
  priorities: string[];
  sections: OneOnOnePrepSection[];
  watchOuts: string[];
  closingMove: string;
}

const ONE_ON_ONE_PREP_PROMPT = `You are an elite coaching strategist preparing a leader for a 1:1 with their direct report.

The report can be either an AE (in which case sales-skill coaching applies) or a Director
(in which case leadership/forecasting coaching applies and the prep should include their team).

INPUT:
- Full report profile: personality summaries, DISC/Enneagram/MBTI, skill scores, strengths, weaknesses, motivations
- Recent coaching notes
- Recent reviews
- A multi-section prep doc the report submitted (text extracted from PDF/DOCX/HTML/TXT)
- For directors: their team roster + per-rep top strength, top gap, last quarter quota %

OUTPUT a strict JSON coaching plan that walks through the prep doc section by section. For each section:
  - title: section heading from the prep doc (preserve their structure)
  - bringUp: what to bring up — markdown allowed (bullets, **bold**, paragraphs)
  - howToBringIt: tone + style guidance based on the AE's personality — markdown allowed
  - questions: array of 2-4 specific questions (plain strings, no markdown)
  - tieToSkill: skill score relevance if there's a clear gap (e.g., "Discovery score 55 — pressure-test their qualification") — markdown allowed
  - tieToProduct: product mastery relevance — markdown allowed (omit if not applicable)
  - tieToPersonality: personality-driven coaching for the coach's eyes only — markdown allowed (omit if not applicable)

Markdown style guidance: keep it simple. Use **bold** for emphasis, - for short bullets, paragraphs separated by blank lines. No HTML, no code blocks. 2-4 sentences per field is plenty.

Also produce:
  - summary: 2-3 sentence overview of what the prep doc reveals (plain prose)
  - priorities: top 3 coaching priorities for THIS conversation (plain strings)
  - watchOuts: 1-3 things to avoid given their personality (plain strings)
  - closingMove: how to end the 1:1 with momentum (1-2 sentences, plain prose)

Be concrete. Avoid generic advice. Reference specific skill scores and personality types by name. High-D wants directness; high-S wants warmth; high-C wants data; high-I wants energy.

Output strict JSON.`;

export async function generateOneOnOnePrep(
  input: OneOnOnePrepInput,
  modelOverride?: string | null,
): Promise<OneOnOnePrepOutput> {
  const model = modelOverride && modelOverride.trim() ? modelOverride.trim() : resolveModelFast();
  return completeJson({
    model,
    system: ONE_ON_ONE_PREP_PROMPT,
    user: { ...input, prepDocText: input.prepDocText.slice(0, 12000) },
    temperature: 0.4,
    jobId: "generateOneOnOnePrep",
  });
}

export interface CoachingPlanInput {
  name: string;
  role: "AE" | "DIRECTOR" | "VP_SALES" | "COMPANY_ADMIN" | "ORG_ADMIN";
  enneagramType?: string | null;
  discProfile?: string | null;
  mbtiType?: string | null;
  personalitySummary?: string | null;
  strengths: string[];
  weaknesses: string[];
  motivations: string[];
  skillScores: Array<{ category: string; score: number }>;
  recentNotes?: Array<{ date: string; content: string }>;
}

export interface CoachingPlanOutput {
  title: string;
  summary: string;
  growthAreas: Array<{
    area: string;
    why: string;
    weeklyMoves: string[];
  }>;
  weeklyHabits: string[];
  bookOrPodRecs: Array<{ title: string; author?: string; reason: string }>;
  ninetyDayCheckpoint: string;
}

const COACHING_PLAN_PROMPT = `You build personalized growth plans for sales professionals. The plan must be specific to THIS person's personality (DISC, Enneagram, MBTI), their skill scores, their strengths and gaps, and their motivations.

Output strict JSON:
{
  "title": "short headline that names the 1-2 main themes",
  "summary": "2-3 sentence framing — what this plan focuses on and why these areas",
  "growthAreas": [
    {
      "area": "specific skill or behavior name",
      "why": "1-2 sentences — why this matters for THIS person, referencing their personality and current scores",
      "weeklyMoves": ["concrete action 1", "concrete action 2", "concrete action 3"]
    }
  ],
  "weeklyHabits": ["micro-habit 1", "micro-habit 2"],
  "bookOrPodRecs": [{"title": "...", "author": "...", "reason": "..."}],
  "ninetyDayCheckpoint": "1-2 sentences describing what success looks like in 90 days"
}

Write 2-4 growthAreas, 3-5 weeklyHabits, 1-3 bookOrPodRecs.

Be concrete. Avoid generic advice. Reference their type names (e.g. "as a high-D / Type 8...") and specific skill scores. High-D wants directness; high-S wants warmth; high-C wants data; high-I wants energy. Type 8 needs vulnerability work; Type 6 needs permission to act on incomplete info; Type 3 needs to slow down and check in.

The weeklyMoves become real tasks — write them as concrete, completable actions starting with a verb ("Schedule", "Book", "Practice", "Rehearse", "Send", "Read", etc.).`;

export async function generateCoachingPlan(
  input: CoachingPlanInput,
  modelOverride?: string | null,
): Promise<CoachingPlanOutput> {
  const model = modelOverride && modelOverride.trim() ? modelOverride.trim() : resolveModelFast();
  const parsed = await completeJson<Partial<CoachingPlanOutput>>({
    model,
    system: COACHING_PLAN_PROMPT,
    user: input,
    temperature: 0.5,
    jobId: "generateCoachingPlan",
  });
  return {
    title: parsed.title || "Your growth plan",
    summary: parsed.summary || "",
    growthAreas: Array.isArray(parsed.growthAreas) ? parsed.growthAreas : [],
    weeklyHabits: Array.isArray(parsed.weeklyHabits) ? parsed.weeklyHabits : [],
    bookOrPodRecs: Array.isArray(parsed.bookOrPodRecs) ? parsed.bookOrPodRecs : [],
    ninetyDayCheckpoint: parsed.ninetyDayCheckpoint || "",
  };
}
