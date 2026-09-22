import { and, eq } from "drizzle-orm";
import { unwrapActiveCustomerKey } from "@/lib/credits/store";
import { getDb } from "@/lib/db/client";
import { credits } from "@/lib/db/schema";
import { pickSuggestionKey } from "./model";

const CHAT_URL = "https://api.x.ai/v1/chat/completions";

/** Org key when Connect AI is BYOK. Platform key otherwise. Missing key returns null. */
export async function resolveSuggestionKey(orgId: string): Promise<string | null> {
  const platform = process.env.XAI_API_KEY ?? null;
  try {
    const db = getDb();
    const [row] = await db
      .select({ mode: credits.mode })
      .from(credits)
      .where(and(eq(credits.orgId, orgId), eq(credits.status, "current")))
      .limit(1);
    const mode = row?.mode ?? "platform";
    if (mode !== "byok") return pickSuggestionKey(mode, null, platform);
    let byok: string | null = null;
    try {
      byok = await unwrapActiveCustomerKey({ orgId });
    } catch {
      byok = null;
    }
    return pickSuggestionKey("byok", byok, platform);
  } catch {
    return pickSuggestionKey(null, null, platform);
  }
}

/** One chat completion. Any failure, including a missing key, returns null so the assist can stand. */
export async function completeWithConfiguredAi(orgId: string, prompt: string): Promise<string | null> {
  try {
    const key = await resolveSuggestionKey(orgId);
    if (!key) return null;
    const model = process.env.XAI_CHAT_MODEL?.trim() || "grok-2-latest";
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Reply with one JSON object only. No markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    return text || null;
  } catch {
    return null;
  }
}
