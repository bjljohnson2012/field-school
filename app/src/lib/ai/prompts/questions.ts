import { completeJson, resolveModelFast, resolveSynthModel } from "../client";

export interface GenerateQuestionsInput {
  category: string;
  count: number;
  context?: {
    productName?: string;
    productSummary?: string;
    salesMethodology?: string;
    companyValues?: string[];
  };
  avoidTexts?: string[];
  allowedTypes?: Array<"LONG_FORM" | "MULTIPLE_CHOICE" | "LIKERT" | "SLIDER">;
}

export interface GeneratedQuestion {
  text: string;
  questionType: "LONG_FORM" | "MULTIPLE_CHOICE" | "LIKERT" | "SLIDER";
  optionsJson?: Array<{ value: string; label: string; tags: string[] }>;
  tagsJson: string[];
  rationale: string;
}

const GENERATE_QUESTIONS_PROMPT = `You are a sales coaching content designer.
Generate intake quiz questions for a specific category.
If "allowedTypes" is provided, ONLY use those types. Otherwise mix LONG_FORM, MULTIPLE_CHOICE, LIKERT (skip SLIDER unless requested).
For MULTIPLE_CHOICE: provide 4 options each with a "tags" array like ["DISCOVERY:+10", "RESILIENCE:-5"] that maps the answer to skill score deltas.
For LIKERT/SLIDER: tagsJson on the question itself maps to skill categories.
Avoid duplicating any text in avoidTexts.
Output JSON: {"questions": [{"text": ..., "questionType": ..., "optionsJson": ..., "tagsJson": [...], "rationale": ...}]}`;

export async function generateQuestions(
  input: GenerateQuestionsInput,
  modelOverride?: string | null,
): Promise<GeneratedQuestion[]> {
  const parsed = await completeJson<{ questions?: GeneratedQuestion[] }>({
    model: resolveSynthModel(modelOverride),
    system: GENERATE_QUESTIONS_PROMPT,
    user: input,
    temperature: 0.7,
    jobId: "generateQuestions",
  });
  return parsed.questions ?? [];
}

export interface EnhanceOptionInput {
  questionText: string;
  questionCategory: string;
  current: { value: string; label: string; tags: string[] };
  goal?: "clearer" | "shorter" | "more diagnostic" | "score-tag review";
}

export interface EnhanceOptionOutput {
  label: string;
  tags: string[];
  rationale: string;
}

const ENHANCE_OPTION_PROMPT = `You are a sales-quiz authoring assistant.
Given a question + one of its multiple-choice options, propose a refined version of just that option.
Keep the option's intent. Tighten the label. Suggest score tags using the format SKILL:+N or SKILL:-N
(skills include DISCOVERY, OBJECTION_HANDLING, CLOSING, COMMUNICATION, RESILIENCE, PRODUCT_MASTERY,
LEADERSHIP, FORECASTING; personality tags include MBTI:E/I/N/T/F/J/P, DISC:D/I/S/C, ENNEAGRAM:1-9).
Output JSON: {"label", "tags", "rationale"}.`;

export async function enhanceMcOption(input: EnhanceOptionInput): Promise<EnhanceOptionOutput> {
  return completeJson({
    model: resolveModelFast(),
    system: ENHANCE_OPTION_PROMPT,
    user: input,
    temperature: 0.4,
    jobId: "enhanceMcOption",
  });
}

export interface SmartBulkInput {
  category: string;
  existingQuestions: Array<{ text: string; tags: string[] }>;
  count: number;
  coverageTargets?: string[];
  styleHint?: string;
  context?: {
    productName?: string;
    salesMethodology?: string;
    companyValues?: string[];
  };
  allowedTypes?: Array<"LONG_FORM" | "MULTIPLE_CHOICE" | "LIKERT" | "SLIDER">;
}

export interface SmartBulkAnalysis {
  coverage: Record<string, number>;
  gaps: string[];
  recommendation: string;
}

export interface SmartBulkOutput {
  analysis: SmartBulkAnalysis;
  questions: GeneratedQuestion[];
}

const SMART_BULK_PROMPT = `You are a sales-quiz authoring assistant.

You're given an existing question bank for a specific category, plus the director's request for new questions.

STEP 1 — Analyze coverage of the existing bank by tag (DISC:D, DISC:I, ENNEAGRAM:1..9, MBTI:E/I/S/N/T/F/J/P, skill names).
STEP 2 — Identify gaps relative to coverageTargets. If no coverageTargets are passed, identify the thinnest tags overall.
STEP 3 — Generate 'count' new questions that:
  - Don't duplicate existing ones (compare semantically, not just text)
  - Prioritize the gaps you identified
  - Use a mix of allowedTypes (default LIKERT-heavy for personality categories, MC-heavy for SALES_STYLE)
  - For LIKERT: questionLevel tags should hint at the personality dimension (e.g., ["DISC:C"])
  - For MC: each option's tags should map to a personality side or skill score delta

Output strict JSON:
{
  "analysis": { "coverage": {"DISC:D": 3, "ENNEAGRAM:8": 0, ...}, "gaps": [...], "recommendation": "..." },
  "questions": [{ "text", "questionType", "optionsJson", "tagsJson", "rationale" }]
}

Be specific to the category. For personality categories, write distinctive statements that an LLM can score reliably.`;

export async function generateSmartBulkQuestions(
  input: SmartBulkInput,
  modelOverride?: string | null,
): Promise<SmartBulkOutput> {
  const trimmedExisting = input.existingQuestions.slice(0, 100).map((q) => ({
    text: q.text.slice(0, 200),
    tags: q.tags.slice(0, 8),
  }));
  return completeJson({
    model: resolveSynthModel(modelOverride),
    system: SMART_BULK_PROMPT,
    user: { ...input, existingQuestions: trimmedExisting },
    temperature: 0.5,
    jobId: "generateSmartBulkQuestions",
  });
}

export interface SelectQuizInput {
  aeName: string;
  weaknesses: string[];
  skillScores: Array<{ category: string; score: number }>;
  focusAreas?: string[];
  candidateQuestions: Array<{
    id: string;
    text: string;
    tags: string[];
    questionType: string;
    category: string;
  }>;
  count: number;
}

export interface SelectQuizOutput {
  questionIds: string[];
  rationale: string;
}

const SELECT_QUIZ_PROMPT = `You are selecting quiz questions for an ad-hoc skill check-in for a sales rep.

Pick the BEST 'count' questions from the candidate pool to assess the rep's progress on
their weakest skills (or the explicit focusAreas, if given). Prefer diversity — mix question
types if available; don't pick 8 LIKERTs in a row when MC is also available.

Return strict JSON: {"questionIds": [<ids in order>], "rationale": "1-2 sentences"}

Make sure you ONLY use IDs from the candidate pool. Don't invent.`;

export async function selectQuizQuestions(
  input: SelectQuizInput,
  modelOverride?: string | null,
): Promise<SelectQuizOutput> {
  return completeJson({
    model: resolveSynthModel(modelOverride),
    system: SELECT_QUIZ_PROMPT,
    user: input,
    temperature: 0.3,
    jobId: "selectQuizQuestions",
  });
}
