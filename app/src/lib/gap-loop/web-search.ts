import { logAiJob, resolveApiKey, resolveBaseUrl, resolveModelFast } from "@/lib/ai/client";
import { queryHitsIdentifier, ticksToUsdMicros, type WebHit } from "./research.ts";

type Env = NodeJS.ProcessEnv;

function endpoint(env: Env) {
  return `${resolveBaseUrl(env)}/chat/completions`;
}

function urlsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && /^https?:\/\//i.test(item.trim())).map((item) => item.trim());
}

function titleFrom(content: string, url: string) {
  const line = content.split("\n").map((part) => part.trim()).find((part) => part.length > 0) || "";
  const clean = line.replace(/^#+\s*/, "").slice(0, 140);
  return clean || url;
}

/**
 * Live web search through the existing xAI key. One web source, a short answer.
 * Kid identifiers are refused before the request is built.
 */
export async function grokWebSearch(
  query: string,
  options: { block?: readonly string[]; env?: Env; fetchImpl?: typeof fetch } = {},
): Promise<WebHit | null> {
  const text = query.replace(/\s+/g, " ").trim();
  if (!text || queryHitsIdentifier(text, options.block || [])) return null;
  const env = options.env ?? process.env;
  const key = resolveApiKey(env);
  const model = resolveModelFast(env);
  const started = Date.now();
  if (!key) {
    logAiJob({ jobId: "gapLoopWeb", model, latencyMs: 0, status: "unavailable" });
    return null;
  }
  const call = options.fetchImpl ?? fetch;
  let status = "failed";
  try {
    const res = await call(endpoint(env), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: "Search the public web. Answer in a short paragraph and include the source URL. Do not invent a person.",
          },
          { role: "user", content: text },
        ],
        search_parameters: {
          mode: "on",
          return_citations: true,
          max_search_results: 3,
          sources: [{ type: "web" }],
        },
      }),
    });
    if (!res.ok) {
      await res.text();
      return null;
    }
    const data = (await res.json()) as {
      citations?: unknown;
      choices?: Array<{ message?: { content?: string | null } }>;
      usage?: { cost_in_usd_ticks?: number };
    };
    const content = data.choices?.[0]?.message?.content || "";
    const url = urlsFrom(data.citations)[0] || urlsFrom(content.match(/https?:\/\/[^\s)]+/g) || [])[0];
    if (!url) return null;
    status = "ok";
    const ticks = data.usage?.cost_in_usd_ticks;
    const usdMicros = typeof ticks === "number" ? ticksToUsdMicros(ticks) || 0 : 0;
    return {
      url,
      title: titleFrom(content, url),
      retrievedOn: new Date().toISOString().slice(0, 10),
      usdMicros,
    };
  } finally {
    logAiJob({
      jobId: "gapLoopWeb",
      model,
      latencyMs: Date.now() - started,
      status,
    });
  }
}
