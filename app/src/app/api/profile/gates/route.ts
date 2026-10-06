import { NextResponse } from "next/server";
import { loadSession } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { gateForTool } from "@/lib/profile/model";
import { loadAdultProfile, recordAdultGate } from "@/lib/profile/store";
import { latestByTool, parseToolSubmission } from "@/lib/tools/results";
import { listToolResults, saveToolResult } from "@/lib/tools/results-store";

export const dynamic = "force-dynamic";

async function adultSession(request: Request) {
  const session = await loadSession(request);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "sign_in_required" }, { status: 401 }) };
  }
  if ((session.member.kind ?? "adult") === "child") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "child_has_no_adult_profile" }, { status: 403 }),
    };
  }
  return { ok: true as const, session };
}

function databaseDown(error: unknown) {
  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
  throw error;
}

/** The signed-in User's latest saved Tools results. */
export async function GET(request: Request) {
  try {
    const auth = await adultSession(request);
    if (!auth.ok) return auth.response;
    const results = await listToolResults(auth.session.member.id);
    return NextResponse.json({ ok: true, results: latestByTool(results) });
  } catch (error) {
    return databaseDown(error);
  }
}

/** Tools Skill → G-skills, Tools Intelligence → G-other. The server scores the answers and keeps the result. */
export async function POST(request: Request) {
  try {
    const auth = await adultSession(request);
    if (!auth.ok) return auth.response;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const parsed = parseToolSubmission(body);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    const gate = gateForTool(parsed.submission.toolSlug);
    if (!gate) return NextResponse.json({ ok: false, error: "not_a_profile_gate" }, { status: 400 });
    const owner = { memberId: auth.session.member.id, name: auth.session.user.name };
    const saved = await saveToolResult(owner.memberId, parsed.submission);
    const at = new Date(saved.result.completedAt);
    let profile = saved.created ? await recordAdultGate(owner, gate, at) : await loadAdultProfile(owner);
    // A replay re-marks only a gate the first save never reached (crash between insert and mark).
    if (!profile.setup.gates.some((g) => g.id === gate && g.done)) {
      profile = await recordAdultGate(owner, gate, at);
    }
    return NextResponse.json({ ok: true, gate, setup: profile.setup, result: saved.result });
  } catch (error) {
    return databaseDown(error);
  }
}
