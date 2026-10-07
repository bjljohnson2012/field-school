import { NextResponse } from "next/server";
import { loadSession } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { gateForTool } from "@/lib/profile/model";
import { loadAdultProfile, recordAdultGate } from "@/lib/profile/store";
import { latestByTool, owedGates, parseToolSubmission } from "@/lib/tools/results";
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
    if (saved.result.toolSlug !== parsed.submission.toolSlug) {
      return NextResponse.json({ ok: false, error: "attempt_reused" }, { status: 409 });
    }
    let profile = await loadAdultProfile(owner);
    const done = new Set(profile.setup.gates.flatMap((g) => (g.done ? [g.id] : [])));
    // A crash or a concurrent save can lose a gate mark; the stored results put it back.
    for (const owed of owedGates(await listToolResults(owner.memberId), done)) {
      profile = await recordAdultGate(owner, owed.gate, new Date(owed.at));
    }
    // A retake of an already-done gate still creates a tool_results row. owedGates
    // skips done gates, so refresh lastAt whenever a new row lands.
    if (saved.created) {
      profile = await recordAdultGate(owner, gate, new Date(saved.result.completedAt));
    }
    return NextResponse.json({ ok: true, gate, setup: profile.setup, result: saved.result });
  } catch (error) {
    return databaseDown(error);
  }
}
