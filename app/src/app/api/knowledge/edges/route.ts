import { NextResponse } from "next/server";
import { edgeViews, parseFocus } from "@/lib/knowledge/graph";
import { loadKnowledge } from "@/lib/knowledge/load";

export const dynamic = "force-dynamic";

/** Read-only inspectable edges for one focus. There is no write path: edges are joins over owned rows. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const focus = parseFocus(url.searchParams.get("focus"), url.searchParams.get("lessons"));
  if (!focus) return NextResponse.json({ ok: false, error: "bad_focus" }, { status: 400 });
  const loaded = await loadKnowledge(focus, request);
  if (!loaded.ok) return NextResponse.json({ ok: false, error: loaded.error }, { status: loaded.status });
  return NextResponse.json({ ok: true, room: loaded.room, edges: edgeViews(loaded.graph), media: loaded.media });
}
