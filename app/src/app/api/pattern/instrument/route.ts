import { NextResponse } from "next/server";
import { INSTRUMENT_SLUG, itemsForSubset } from "@/lib/pattern/items";
import { LIKERT_MAX, LIKERT_MIN } from "@/lib/pattern/score";
import { ensureInstrument } from "@/lib/pattern/seed";
import { DatabaseUnavailableError } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subset = url.searchParams.get("subset") === "child" ? "child" : "adult";
  try {
    await ensureInstrument();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
  const items = itemsForSubset(subset).map((item) => ({
    key: item.key,
    prompt: item.prompt,
    child: item.child,
  }));
  return NextResponse.json({
    slug: INSTRUMENT_SLUG,
    name: "Field Pattern",
    subset,
    likert: { min: LIKERT_MIN, max: LIKERT_MAX },
    count: items.length,
    items,
  });
}
