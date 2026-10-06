/**
 * One OpenAI-compatible xAI client for coaching and Field Pattern speech.
 * Prompt functions live in ./prompts and call this module. There is no second client.
 *
 * May 2026 model rename: grok-4-fast-reasoning is not a default.
 * Fast tier default is grok-4.20-non-reasoning. Synth tier default is grok-4.3.
 */

export const XAI_BASE_URL_DEFAULT = "https://api.x.ai/v1";
export const MODEL_FAST = "grok-4.20-non-reasoning";
export const MODEL_DEFAULT = "grok-4.3";
export const STT_MODEL_DEFAULT = "grok-stt";

const COACH_ONLY_CATEGORIES = new Set(["PERSONALITY", "LEADERSHIP"]);

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TokenUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

export type AiJobLog = {
  jobId?: string | null;
  orgId?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  status?: string | null;
  usage?: TokenUsage | null;
};

type Env = NodeJS.ProcessEnv;

function trimmed(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function resolveApiKey(env: Env = process.env): string | undefined {
  const grok = trimmed(env.GROK_API_KEY);
  if (grok) return grok;
  const xai = trimmed(env.XAI_API_KEY);
  return xai || undefined;
}

export function resolveBaseUrl(env: Env = process.env): string {
  const configured = trimmed(env.GROK_BASE_URL);
  return (configured || XAI_BASE_URL_DEFAULT).replace(/\/+$/, "");
}

export function resolveModelFast(env: Env = process.env): string {
  return trimmed(env.GROK_MODEL_FAST) || MODEL_FAST;
}

export function resolveModelDefault(env: Env = process.env): string {
  return trimmed(env.GROK_MODEL) || MODEL_DEFAULT;
}

/** Per-org override is organizations.features.aiModel. Blank falls through to MODEL_DEFAULT. */
export function resolveSynthModel(orgModel?: string | null, env: Env = process.env): string {
  const override = orgModel?.trim();
  if (override) return override;
  return resolveModelDefault(env);
}

export function resolveSttModel(env: Env = process.env): string {
  return trimmed(env.XAI_STT_MODEL) || STT_MODEL_DEFAULT;
}

function endpoint(path: string, env: Env = process.env): string {
  const base = resolveBaseUrl(env);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function tokenUsage(usage: unknown): TokenUsage | null {
  if (!usage || typeof usage !== "object") return null;
  const record = usage as Record<string, unknown>;
  const num = (key: string) => (typeof record[key] === "number" ? (record[key] as number) : null);
  return {
    promptTokens: num("prompt_tokens") ?? num("promptTokens"),
    completionTokens: num("completion_tokens") ?? num("completionTokens"),
    totalTokens: num("total_tokens") ?? num("totalTokens"),
  };
}

/**
 * Info log for a model call. Copies only job metadata.
 * Answer text, prompts, and profile narratives are dropped.
 */
export function logAiJob(fields: AiJobLog & Record<string, unknown>): void {
  const line = {
    event: "coaching.ai.job",
    jobId: typeof fields.jobId === "string" ? fields.jobId : null,
    orgId: typeof fields.orgId === "string" ? fields.orgId : null,
    model: typeof fields.model === "string" ? fields.model : null,
    latencyMs: typeof fields.latencyMs === "number" ? fields.latencyMs : null,
    status: typeof fields.status === "string" ? fields.status : null,
    usage: tokenUsage(fields.usage),
  };
  console.info(JSON.stringify(line));
}

export function forceCoachRoute<T extends { category?: string | null }>(rec: T): T {
  const category = String(rec.category ?? "").trim().toUpperCase();
  if (!COACH_ONLY_CATEGORIES.has(category)) return rec;
  return { ...rec, routeTo: "coach", route_to: "coach" } as T;
}

export async function completeChat(input: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
  jobId: string;
  orgId?: string | null;
  env?: Env;
}): Promise<{ content: string }> {
  const env = input.env ?? process.env;
  const key = resolveApiKey(env);
  const started = Date.now();
  if (!key) {
    logAiJob({
      jobId: input.jobId,
      orgId: input.orgId,
      model: input.model,
      latencyMs: 0,
      status: "unavailable",
    });
    throw new Error("xai_unavailable");
  }

  let status = "failed";
  let usage: TokenUsage | null = null;
  try {
    const res = await fetch(endpoint("/chat/completions", env), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.3,
        ...(input.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      await res.text();
      throw new Error("xai_failed");
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
      usage?: unknown;
    };
    usage = tokenUsage(data.usage);
    status = "ok";
    return { content: data.choices?.[0]?.message?.content ?? "" };
  } finally {
    logAiJob({
      jobId: input.jobId,
      orgId: input.orgId ?? null,
      model: input.model,
      latencyMs: Date.now() - started,
      status,
      usage,
    });
  }
}

export async function completeJson<T>(input: {
  model: string;
  system: string;
  user: unknown;
  temperature?: number;
  jobId: string;
  orgId?: string | null;
  env?: Env;
}): Promise<T> {
  const { content } = await completeChat({
    model: input.model,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: JSON.stringify(input.user, null, 2) },
    ],
    temperature: input.temperature,
    json: true,
    jobId: input.jobId,
    orgId: input.orgId,
    env: input.env,
  });
  if (!content.trim()) throw new Error("Grok returned empty response");
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("Grok returned invalid JSON");
  }
}

export async function askGrok(
  systemPrompt: string,
  userPayload: string,
  jsonMode = false,
  modelOverride?: string | null,
): Promise<string> {
  const { content } = await completeChat({
    model: resolveSynthModel(modelOverride),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPayload },
    ],
    temperature: 0.3,
    json: jsonMode,
    jobId: "askGrok",
  });
  return content ?? "";
}

function audioForm(bytes: Buffer, filename: string, mime: string, model: string): FormData {
  const blob = new Blob([new Uint8Array(bytes)], { type: mime || "application/octet-stream" });
  const body = new FormData();
  body.append("file", blob, filename || "audio.webm");
  body.append("model", model);
  return body;
}

async function postAudio(
  path: string,
  bytes: Buffer,
  filename: string,
  mime: string,
  model: string,
  key: string,
  env: Env,
): Promise<Response> {
  return fetch(endpoint(path, env), {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: audioForm(bytes, filename, mime, model),
  });
}

async function textFromStt(res: Response): Promise<string | null> {
  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim();
  return text || null;
}

/** /v1/stt, then /v1/audio/transcriptions. Callers do not open their own client. */
export async function transcribe(
  bytes: Buffer,
  filename: string,
  mime: string,
  env: Env = process.env,
): Promise<string> {
  const key = resolveApiKey(env);
  const model = resolveSttModel(env);
  const started = Date.now();
  if (!key) {
    logAiJob({ jobId: "transcribe", model, latencyMs: 0, status: "unavailable" });
    throw new Error("stt_unavailable");
  }

  let status = "failed";
  try {
    const primary = await postAudio("/stt", bytes, filename, mime, model, key, env);
    if (primary.ok) {
      const text = await textFromStt(primary);
      if (!text) throw new Error("stt_empty");
      status = "ok";
      return text;
    }
    await primary.text();
    const fallback = await postAudio("/audio/transcriptions", bytes, filename, mime, model, key, env);
    if (!fallback.ok) {
      await fallback.text();
      throw new Error("stt_failed");
    }
    const text = await textFromStt(fallback);
    if (!text) throw new Error("stt_empty");
    status = "ok";
    return text;
  } finally {
    logAiJob({
      jobId: "transcribe",
      model,
      latencyMs: Date.now() - started,
      status,
    });
  }
}
