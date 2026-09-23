import { completeJson, resolveModelFast, resolveSynthModel } from "../client";

export interface ClassifyFileInput {
  filename: string;
  mimeType: string;
  textPreview: string;
  candidateAes: Array<{ id: string; name: string }>;
}

export interface ClassifyFileOutput {
  kind:
    | "AE_PREP_DOC"
    | "COACHING_DOC"
    | "PROFILE_ASSET"
    | "PRODUCT_REFERENCE"
    | "PERSONALITY_NOTE"
    | "GENERAL"
    | "OTHER";
  aeProfileId?: string;
  updateIntent: "ADD_TO_COACHING_LOG" | "UPDATE_PROFILE" | "REFERENCE_ONLY";
  visibility: "AE_ONLY" | "DIRECTOR_ONLY" | "BOTH";
  confidence: number;
  rationale: string;
}

const CLASSIFY_FILE_PROMPT = `You are a file router for a sales coaching platform.
Given a filename, mime type, and text preview, suggest:
- kind: best match from the enum
- aeProfileId: if the doc is clearly about a specific AE (use their id), else omit
- updateIntent: ADD_TO_COACHING_LOG | UPDATE_PROFILE | REFERENCE_ONLY
- visibility: AE_ONLY | DIRECTOR_ONLY | BOTH (default DIRECTOR_ONLY for coaching/personality content)
- confidence: 0-1
- rationale: 1 sentence

Personality notes default to DIRECTOR_ONLY visibility. Coaching docs about a specific AE → ADD_TO_COACHING_LOG. Prep docs → ADD_TO_COACHING_LOG with high confidence on aeProfileId.
Output JSON.`;

export async function classifyFile(input: ClassifyFileInput): Promise<ClassifyFileOutput> {
  return completeJson({
    model: resolveModelFast(),
    system: CLASSIFY_FILE_PROMPT,
    user: input,
    temperature: 0.2,
    jobId: "classifyFile",
  });
}

export interface ArticleFromUrlInput {
  url: string;
  repositoryKind: "PRODUCT" | "SALES_SKILL" | "PERSONALITY" | "LEADERSHIP" | "CUSTOM";
  repositoryName: string;
  intentNote?: string;
}

export interface ArticleFromUrlOutput {
  title: string;
  body: string;
  tags: string[];
  summary: string;
  confidence?: "high" | "medium" | "low";
}

const ARTICLE_FROM_URL_PROMPT = `You are organizing a knowledge library.
Given a URL, write a clean knowledge article entry. Use what you already know about the URL or its likely contents based on the domain, path, and topic.
If the URL is obviously not informative (a homepage with no specifics, a paywalled site you can't reason about), say so honestly in the body — don't fabricate.

Output strict JSON:
{
  "title": "4-10 word specific title",
  "body": "clean markdown — 200-700 words ideally; preserve structure (## headings, bullets); end with a 'Source' line citing the URL",
  "tags": ["3-7 short keyword tags"],
  "summary": "one sentence describing what this teaches",
  "confidence": "high | medium | low — how confident you are about the page contents"
}`;

export async function articleFromUrl(
  input: ArticleFromUrlInput,
  modelOverride?: string | null,
): Promise<ArticleFromUrlOutput> {
  return completeJson({
    model: resolveSynthModel(modelOverride),
    system: ARTICLE_FROM_URL_PROMPT,
    user: input,
    temperature: 0.4,
    jobId: "articleFromUrl",
  });
}

export interface CleanupArticleInput {
  title: string;
  body: string;
  tags: string[];
  instructions: string;
  repositoryName?: string;
}

export interface CleanupArticleOutput {
  title: string;
  body: string;
  tags: string[];
  changeSummary: string;
}

const CLEANUP_ARTICLE_PROMPT = `You are an editor for a knowledge library.
Given a current article + the editor's instructions, return a revised version.
Keep what the editor likes. Apply only what they asked. Don't invent facts not in the original or implied by the instructions.
Output JSON: {"title", "body", "tags", "changeSummary"}.`;

export async function cleanupArticleWithInstructions(
  input: CleanupArticleInput,
): Promise<CleanupArticleOutput> {
  return completeJson({
    model: resolveModelFast(),
    system: CLEANUP_ARTICLE_PROMPT,
    user: input,
    temperature: 0.4,
    jobId: "cleanupArticleWithInstructions",
  });
}

export interface ExtractArticleInput {
  rawText: string;
  repositoryKind: "PRODUCT" | "SALES_SKILL" | "PERSONALITY" | "LEADERSHIP" | "CUSTOM";
  repositoryName: string;
  filename?: string;
}

export interface ExtractArticleOutput {
  title: string;
  body: string;
  tags: string[];
  summary: string;
}

const EXTRACT_ARTICLE_PROMPT = `You are organizing a knowledge library.
Given raw text (pasted or extracted from a file), produce a clean article entry.
- title: 4-10 words, specific, action-oriented if possible
- body: clean up the raw text into readable markdown. Preserve structure (headings, bullets). Remove fluff. Trim to <=2000 words.
- tags: 3-7 short keyword tags (lowercase, single words preferred)
- summary: one sentence describing what this article teaches

Output strict JSON.`;

export async function extractArticleMetadata(input: ExtractArticleInput): Promise<ExtractArticleOutput> {
  return completeJson({
    model: resolveModelFast(),
    system: EXTRACT_ARTICLE_PROMPT,
    user: {
      repositoryKind: input.repositoryKind,
      repositoryName: input.repositoryName,
      filename: input.filename ?? null,
      rawText: input.rawText.slice(0, 12000),
    },
    temperature: 0.3,
    jobId: "extractArticleMetadata",
  });
}

export interface SynthesizeProductInput {
  productName: string;
  audience?: string;
  sourceTexts: Array<{ filename: string; text: string }>;
}

export interface SynthesizedProduct {
  summary: string;
  keyValueProps: string[];
  audienceFit: string[];
  commonObjections: string[];
  competitiveDifferentiators: string[];
  demoFlow: string[];
}

const SYNTHESIZE_PRODUCT_PROMPT = `You analyze multiple source files about a single product and synthesize a clean product brief.
Be specific. Cite from the source text where possible (don't invent).
Output strict JSON:
{
  "summary": "3-5 sentences",
  "keyValueProps": ["...", "..."],
  "audienceFit": ["..."],
  "commonObjections": ["..."],
  "competitiveDifferentiators": ["..."],
  "demoFlow": ["step 1", "step 2", ...]
}`;

export async function synthesizeProductBrief(
  input: SynthesizeProductInput,
  modelOverride?: string | null,
): Promise<SynthesizedProduct> {
  const trimmed = input.sourceTexts.map((source) => ({
    filename: source.filename,
    text: source.text.slice(0, 8000),
  }));
  return completeJson({
    model: resolveSynthModel(modelOverride),
    system: SYNTHESIZE_PRODUCT_PROMPT,
    user: { ...input, sourceTexts: trimmed },
    temperature: 0.3,
    jobId: "synthesizeProductBrief",
  });
}
