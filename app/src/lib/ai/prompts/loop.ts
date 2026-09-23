import { completeChat, completeJson, forceCoachRoute, resolveModelFast, resolveSynthModel } from "../client";

export interface RecommendInput {
  aeProfile: {
    name: string;
    strengths: string[];
    weaknesses: string[];
    skillScores: Array<{ category: string; score: number }>;
  };
  contextArticles: Array<{
    id: string;
    repositoryKind: "PRODUCT" | "SALES_SKILL" | "PERSONALITY" | "LEADERSHIP";
    title: string;
    body: string;
    productName?: string;
    skillCategory?: string;
  }>;
  focus?: "weakest_skill" | "specific_product" | "broad";
}

export interface AiRecommendation {
  title: string;
  description: string;
  category: "SALES_SKILL" | "PRODUCT_KNOWLEDGE" | "PERSONALITY" | "LEADERSHIP" | "HEALTH" | "GENERAL";
  routeTo: "learner" | "coach";
  route_to?: "learner" | "coach";
  channel: "task" | "email" | "note";
  sourceArticleIds: string[];
}

const RECOMMEND_SYSTEM_PROMPT = `You generate actionable recommendations for sales coaches and AEs.
Given the AE profile and a set of relevant knowledge articles, output 2-5 recommendations.
Each one cites which sourceArticleIds informed it.

ROUTING RULES (server enforces, but follow them too):
- PERSONALITY → routeTo "coach", channel "note"
- LEADERSHIP → routeTo "coach", channel "note"
- SALES_SKILL → routeTo "learner", channel "task" or "email"
- PRODUCT_KNOWLEDGE → routeTo "learner", channel "task"
- HEALTH/wellbeing → routeTo "learner", channel "email" with a soft tone

Output JSON: {"recommendations": [...]}`;

export async function generateRecommendations(
  input: RecommendInput,
  modelOverride?: string | null,
): Promise<AiRecommendation[]> {
  const parsed = await completeJson<{ recommendations?: AiRecommendation[] }>({
    model: resolveSynthModel(modelOverride),
    system: RECOMMEND_SYSTEM_PROMPT,
    user: input,
    temperature: 0.5,
    jobId: "generateRecommendations",
  });
  return (parsed.recommendations ?? []).map((rec) => forceCoachRoute(rec));
}

export interface MonthlyReviewInput {
  aeName: string;
  monthOf: string;
  director: { name: string };
  answers: Array<{
    questionText: string;
    questionType: string;
    value: unknown;
    skillCategory?: string;
  }>;
  priorScores: Array<{ category: string; score: number }>;
}

export interface MonthlyReviewOutput {
  summary: string;
  scoreDeltas: Array<{ category: string; delta: number; rationale: string }>;
  followUpRecommendations: Array<{
    title: string;
    description: string;
    category: string;
    routeTo: "learner" | "coach";
    route_to?: "learner" | "coach";
  }>;
}

const MONTHLY_REVIEW_PROMPT = `You analyze a director's monthly review of an AE.
Given prior scores and the director's structured answers, output:
- summary: 2-3 sentence narrative
- scoreDeltas: how to adjust each skill score (-15 to +15 typically; reserve larger for clear evidence)
- followUpRecommendations: 1-3 next-step recs, with category and routeTo (PERSONALITY and LEADERSHIP → coach)
Output JSON.`;

export async function summarizeMonthlyReview(
  input: MonthlyReviewInput,
  modelOverride?: string | null,
): Promise<MonthlyReviewOutput> {
  const parsed = await completeJson<MonthlyReviewOutput>({
    model: resolveSynthModel(modelOverride),
    system: MONTHLY_REVIEW_PROMPT,
    user: input,
    temperature: 0.3,
    jobId: "summarizeMonthlyReview",
  });
  return {
    ...parsed,
    followUpRecommendations: (parsed.followUpRecommendations ?? []).map((rec) => forceCoachRoute(rec)),
  };
}

export interface GenerateTasksInput {
  aeName: string;
  strengths: string[];
  weaknesses: string[];
  skillScores: Array<{ category: string; score: number }>;
  existingOpenTasks: Array<{ title: string }>;
  count?: number;
  role?: "AE" | "DIRECTOR" | "VP_SALES" | "COMPANY_ADMIN" | "ORG_ADMIN";
}

export interface GeneratedTask {
  title: string;
  description: string;
  urgency: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  category: "SALES_SKILL" | "PRODUCT_KNOWLEDGE" | "PERSONALITY" | "GENERAL";
  dueInDays: number;
  rationale: string;
}

const GENERATE_TASKS_PROMPT_AE = `You are a sales coach generating an AE's next-best-action task list.
Avoid duplicating any task in existingOpenTasks.
Rank by urgency: URGENT (this week), HIGH (this 2 weeks), MEDIUM (this month), LOW (next quarter).
Focus on the AE's lowest skill scores. Make tasks specific, actionable, and measurable — NOT "improve discovery" but "Run two discovery calls this week and capture MEDDPICC notes for each."

Routing rule: PERSONALITY tasks default urgency to LOW because personality is for director coaching, not AE self-action.

Output JSON: {"tasks": [{title, description, urgency, category, dueInDays, rationale}]}`;

const GENERATE_TASKS_PROMPT_LEADER = `You are an executive sales coach generating a SALES LEADER's next-best-action task list.
The target is a Director / VP / Sales Leader — NOT an individual contributor.

CRITICAL ROLE BOUNDARIES — never violate these:
- Do NOT assign individual-contributor tasks: prospecting, building top of funnel, running discovery calls, sending outbound emails, booking demos, cold-calling, working specific deals.
- DO assign leadership and enablement tasks: coaching their AEs, running deal reviews, observing calls, providing feedback, building team rituals, hiring, performance management, forecast accuracy, pipeline coverage rituals, team training.
- Reframe IC weaknesses as coaching opportunities: instead of "build top of funnel," generate "coach AE on building top of funnel" or "review prospecting metrics with each rep."

The skillScores you see ARE the leader's leadership skill scores (DIRECTOR_COACHING, FORECASTING, LEADERSHIP, etc.) — focus tasks on growing their leadership behaviors and improving the team they coach.

Avoid duplicating any task in existingOpenTasks.
Rank by urgency: URGENT (this week), HIGH (this 2 weeks), MEDIUM (this month), LOW (next quarter).
Make tasks specific, actionable, and measurable — NOT "coach the team" but "Run a 30-minute call review with each direct report this week using the MEDDPICC scorecard."

Output JSON: {"tasks": [{title, description, urgency, category, dueInDays, rationale}]}`;

export async function generateTasksForAe(
  input: GenerateTasksInput,
  modelOverride?: string | null,
): Promise<GeneratedTask[]> {
  const isLeader = input.role && input.role !== "AE";
  const userPayload = isLeader
    ? {
        leaderName: input.aeName,
        leaderRole: input.role,
        leaderStrengths: input.strengths,
        leaderWeaknesses: input.weaknesses,
        leadershipSkillScores: input.skillScores,
        existingOpenTasks: input.existingOpenTasks,
        count: input.count ?? 5,
      }
    : { ...input, count: input.count ?? 5 };
  const parsed = await completeJson<{ tasks?: GeneratedTask[] }>({
    model: resolveSynthModel(modelOverride),
    system: isLeader ? GENERATE_TASKS_PROMPT_LEADER : GENERATE_TASKS_PROMPT_AE,
    user: userPayload,
    temperature: 0.5,
    jobId: "generateTasksForAe",
  });
  return parsed.tasks ?? [];
}

export interface TaskDescribeInput {
  title: string;
  aeName: string;
  weaknesses: string[];
  strengths: string[];
  skillScores: Array<{ category: string; score: number }>;
}

const TASK_DESCRIPTION_PROMPT = `You are a sales coach turning a task title into a 2-4 sentence actionable description.
Given the AE's profile, write what they should DO, by WHEN, and HOW success is measured.
Tie to their lowest skill scores when relevant. Concrete, not generic.
Output plain text — no markdown headings.`;

export async function generateTaskDescription(input: TaskDescribeInput): Promise<string> {
  const { content } = await completeChat({
    model: resolveModelFast(),
    messages: [
      { role: "system", content: TASK_DESCRIPTION_PROMPT },
      { role: "user", content: JSON.stringify(input, null, 2) },
    ],
    temperature: 0.5,
    jobId: "generateTaskDescription",
  });
  return content.trim();
}

export interface CompareNarrativeSubject {
  name: string;
  enneagramType?: string | null;
  discProfile?: string | null;
  mbtiType?: string | null;
  strengths: string[];
  weaknesses: string[];
  motivations: string[];
  skillScores: Array<{ category: string; score: number }>;
}

export interface CompareNarrativeOutput {
  summary: string;
  contrasts: string[];
  whoToInvestIn: string;
  collectiveTheme: string;
}

const COMPARE_NARRATIVE_PROMPT = `You are a sales coaching strategist comparing 2-4 AEs side-by-side.

Output strict JSON:
{
  "summary": "2-3 sentences naming each AE's archetype and how they cluster or diverge",
  "contrasts": ["3-5 specific differences worth coaching toward — name the AEs by name"],
  "whoToInvestIn": "1-2 sentences identifying the AE with the highest leverage gap and why",
  "collectiveTheme": "1 sentence on a pattern across the group, OR empty string if there isn't one"
}

Tone: direct, specific, no fluff. Reference DISC types, Enneagram types, and skill scores by name. Avoid generic coaching advice — the leader knows the basics.`;

export async function generateCompareNarrative(
  aes: CompareNarrativeSubject[],
): Promise<CompareNarrativeOutput> {
  const parsed = await completeJson<Partial<CompareNarrativeOutput>>({
    model: resolveModelFast(),
    system: COMPARE_NARRATIVE_PROMPT,
    user: { aes },
    temperature: 0.4,
    jobId: "generateCompareNarrative",
  });
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    contrasts: Array.isArray(parsed.contrasts) ? parsed.contrasts : [],
    whoToInvestIn: typeof parsed.whoToInvestIn === "string" ? parsed.whoToInvestIn : "",
    collectiveTheme: typeof parsed.collectiveTheme === "string" ? parsed.collectiveTheme : "",
  };
}

export interface WeeklyBriefInput {
  name: string;
  role: "AE" | "DIRECTOR" | "VP_SALES" | "COMPANY_ADMIN" | "ORG_ADMIN";
  enneagramType?: string | null;
  discProfile?: string | null;
  mbtiType?: string | null;
  weakestSkills: Array<{ category: string; score: number }>;
  topStrength?: string;
  motivations?: string[];
}

export interface WeeklyBriefOutput {
  greeting: string;
  thisWeek: {
    focus: string;
    challenge: string;
    miniTip: string;
  };
  funFactOrQuote: string;
  closer: string;
}

const WEEKLY_BRIEF_PROMPT = `You write the Monday-morning improvement brief for sales professionals. The brief is SHORT, ENERGETIC, and SPECIFIC.

The reader is starting their week — give them ONE thing to focus on, ONE concrete experiment to try, ONE micro-tip, and a short fact or quote that relates. Tie everything to their personality type and weakest skill.

Output strict JSON:
{
  "greeting": "1 line, warm and named",
  "thisWeek": {
    "focus": "1-2 sentences naming the week's improvement theme",
    "challenge": "concrete experiment to try this week, 1-2 sentences",
    "miniTip": "tactical paragraph tied to their weakest skill + personality (3-4 sentences)"
  },
  "funFactOrQuote": "short quote or fact, attribution if quote",
  "closer": "1 line of encouragement"
}

Tone: Friendly, slightly playful, not corporate. Ryan Holiday meets your favorite sales mentor. Reference their personality type by name (e.g. "as a high-D / Type 8...").

Keep it tight. If you write more than 200 words total, you've gone too far.`;

export async function generateWeeklyBrief(
  input: WeeklyBriefInput,
  modelOverride?: string | null,
): Promise<WeeklyBriefOutput> {
  const model = modelOverride && modelOverride.trim() ? modelOverride.trim() : resolveModelFast();
  const parsed = await completeJson<Partial<WeeklyBriefOutput>>({
    model,
    system: WEEKLY_BRIEF_PROMPT,
    user: input,
    temperature: 0.7,
    jobId: "generateWeeklyBrief",
  });
  return {
    greeting: parsed.greeting || `Happy Monday, ${input.name.split(" ")[0]}.`,
    thisWeek: {
      focus: parsed.thisWeek?.focus || "",
      challenge: parsed.thisWeek?.challenge || "",
      miniTip: parsed.thisWeek?.miniTip || "",
    },
    funFactOrQuote: parsed.funFactOrQuote || "",
    closer: parsed.closer || "Make it a great week.",
  };
}
