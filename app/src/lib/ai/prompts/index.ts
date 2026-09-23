export { askGrok, forceCoachRoute, resolveApiKey, resolveBaseUrl, resolveModelDefault, resolveModelFast, resolveSttModel, resolveSynthModel, transcribe, MODEL_DEFAULT, MODEL_FAST, STT_MODEL_DEFAULT, XAI_BASE_URL_DEFAULT } from "../client";

export {
  DIRECTOR_SYSTEM_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
  synthesizeDirectorProfile,
  synthesizeProfile,
} from "./synthesis";
export type { DirectorSynthesizeInput, DirectorSynthesizedProfile, SynthesizeInput, SynthesizedProfile } from "./synthesis";

export { crossReferencePrepDoc, generateCoachingPlan, generateOneOnOnePrep } from "./plans";
export type {
  CoachingPlanInput,
  CoachingPlanOutput,
  CrossRefInput,
  CrossRefOutput,
  OneOnOnePrepInput,
  OneOnOnePrepOutput,
} from "./plans";

export { generateCoachingHints, generatePersonalityComparison } from "./person";
export type {
  CoachingHintsInput,
  CoachingHintsOutput,
  PersonalityCompareInput,
  PersonalityCompareOutput,
} from "./person";

export {
  enhanceMcOption,
  generateQuestions,
  generateSmartBulkQuestions,
  selectQuizQuestions,
} from "./questions";
export type {
  EnhanceOptionInput,
  EnhanceOptionOutput,
  GeneratedQuestion,
  GenerateQuestionsInput,
  SelectQuizInput,
  SelectQuizOutput,
  SmartBulkInput,
  SmartBulkOutput,
} from "./questions";

export {
  articleFromUrl,
  classifyFile,
  cleanupArticleWithInstructions,
  extractArticleMetadata,
  synthesizeProductBrief,
} from "./knowledge";
export type {
  ArticleFromUrlInput,
  ArticleFromUrlOutput,
  ClassifyFileInput,
  ClassifyFileOutput,
  CleanupArticleInput,
  CleanupArticleOutput,
  ExtractArticleInput,
  ExtractArticleOutput,
  SynthesizeProductInput,
  SynthesizedProduct,
} from "./knowledge";

export {
  generateCompareNarrative,
  generateRecommendations,
  generateTaskDescription,
  generateTasksForAe,
  generateWeeklyBrief,
  summarizeMonthlyReview,
} from "./loop";
export type {
  AiRecommendation,
  CompareNarrativeOutput,
  CompareNarrativeSubject,
  GeneratedTask,
  GenerateTasksInput,
  MonthlyReviewInput,
  MonthlyReviewOutput,
  RecommendInput,
  TaskDescribeInput,
  WeeklyBriefInput,
  WeeklyBriefOutput,
} from "./loop";

export { DRILL_PROMPT_AE, DRILL_PROMPT_LEADER, GRADER_PROMPT, generateDrillPrompt, gradeDrillResponse } from "./drills";
export type { DrillPromptOutput, GradeOutput } from "./drills";
