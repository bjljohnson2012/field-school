import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { actorMayWrite, type Room } from "@/lib/living-brain/model";
import { toolRead, writeAssist, writeFactsAssist, writeOutcome } from "@/lib/living-brain/store";

export const dynamic = "force-dynamic";

function roomOf(slug: string): Room | null {
  return slug === "household" || slug === "sales" ? slug : null;
}

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_has_no_login" }, { status: 403 });
  }
  const room = roomOf(auth.identity.orgSlug);
  if (!room) return NextResponse.json({ ok: false, error: "wrong_desk" }, { status: 403 });
  try {
    const brain = await toolRead(auth.identity.orgId);
    return NextResponse.json({
      ok: true,
      room,
      brain: brain && brain.room === room ? brain : { orgId: auth.identity.orgId, room, facts: "", people: [] },
    });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_has_no_login" }, { status: 403 });
  }
  const room = roomOf(auth.identity.orgSlug);
  if (!room) return NextResponse.json({ ok: false, error: "wrong_desk" }, { status: 403 });
  const actor = {
    kind: auth.identity.kind,
    stance: auth.identity.stance,
    org: room,
    membershipId: auth.identity.membershipId,
  };
  if (!actorMayWrite(actor)) {
    return NextResponse.json({ ok: false, error: "not_leader" }, { status: 403 });
  }
  let body: {
    assist?: boolean;
    assistFacts?: boolean;
    membershipId?: string;
    name?: string;
    kind?: string;
    login?: string;
    profile?: string;
    outcomes?: string;
    pathTitle?: string;
    nextStep?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (body.assistFacts === true) {
    try {
      const result = await writeFactsAssist({ orgId: auth.identity.orgId, actor });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 403 });
      return NextResponse.json({ ok: true, brain: result.brain });
    } catch (error) {
      if (error instanceof DatabaseUnavailableError) {
        return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
      }
      throw error;
    }
  }
  const membershipId = typeof body.membershipId === "string" ? body.membershipId.trim() : "";
  const login = body.login === "none" || body.login === "member" ? body.login : room === "household" ? "none" : "member";
  const kind = typeof body.kind === "string" && body.kind.trim() ? body.kind.trim() : room === "household" ? "child" : "adult";
  if (!membershipId) return NextResponse.json({ ok: false, error: "not_on_desk" }, { status: 400 });
  try {
    if (body.assist === true) {
      const result = await writeAssist({
        orgId: auth.identity.orgId,
        actor,
        membershipId,
        context: {
          pathTitle: typeof body.pathTitle === "string" ? body.pathTitle : "",
          nextStep: typeof body.nextStep === "string" ? body.nextStep : "",
        },
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 403 });
      return NextResponse.json({ ok: true, brain: result.brain, source: result.source });
    }
    const result = await writeOutcome({
      orgId: auth.identity.orgId,
      actor,
      membershipId,
      outcomes: typeof body.outcomes === "string" ? body.outcomes : "",
      person: {
        name: typeof body.name === "string" ? body.name : "",
        kind,
        login,
        profile: typeof body.profile === "string" ? body.profile : "",
      },
    });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 403 });
    return NextResponse.json({ ok: true, brain: result.brain });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
}
