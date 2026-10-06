import { NextResponse } from "next/server";
import { loadSession } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { gateForTool } from "@/lib/profile/model";
import { recordAdultGate } from "@/lib/profile/store";

export const dynamic = "force-dynamic";

/** Tools Skill → G-skills, Tools Intelligence → G-other. Field Pattern is read from its own runs. */
export async function POST(request: Request) {
  try {
    const session = await loadSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: "sign_in_required" }, { status: 401 });
    }
    if ((session.member.kind ?? "adult") === "child") {
      return NextResponse.json({ ok: false, error: "child_has_no_adult_profile" }, { status: 403 });
    }
    let body: { tool?: unknown };
    try {
      body = (await request.json()) as { tool?: unknown };
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const gate = typeof body.tool === "string" ? gateForTool(body.tool) : null;
    if (!gate) return NextResponse.json({ ok: false, error: "not_a_profile_gate" }, { status: 400 });
    const profile = await recordAdultGate({ memberId: session.member.id, name: session.user.name }, gate);
    return NextResponse.json({ ok: true, gate, setup: profile.setup });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
}
