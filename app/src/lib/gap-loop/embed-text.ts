import { logAiJob, resolveApiKey, resolveBaseUrl } from "@/lib/ai/client";
import { EMBEDDING_CONFIG } from "./embedding.ts";

type Env = NodeJS.ProcessEnv;

/** Embed one passage with the configured xAI model. A missing key leaves the column null. */
export async function embedPassage(text: string, env: Env = process.env): Promise<number[] | null> {
  const clean = text.replace(/\s+/g, " ").trim();
  const key = resolveApiKey(env);
  const model = EMBEDDING_CONFIG.model;
  const started = Date.now();
  if (!key || !clean) {
    logAiJob({ jobId: "gapLoopEmbed", model, latencyMs: 0, status: "unavailable" });
    return null;
  }
  let status = "failed";
  try {
    const res = await fetch(`${resolveBaseUrl(env)}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: `passage: ${clean.slice(0, 2000)}`,
        dimensions: EMBEDDING_CONFIG.dimensions,
        encoding_format: "float",
      }),
    });
    if (!res.ok) {
      await res.text();
      return null;
    }
    const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const vector = data.data?.[0]?.embedding;
    if (!vector || vector.length !== EMBEDDING_CONFIG.dimensions) return null;
    status = "ok";
    return vector;
  } finally {
    logAiJob({ jobId: "gapLoopEmbed", model, latencyMs: Date.now() - started, status });
  }
}
