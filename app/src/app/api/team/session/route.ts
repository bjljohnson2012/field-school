import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { SALES_SLUG } from "@/lib/campus-runtime/rules";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";
import {
  TEAM_ORG,
  fireLeaderSession,
  readTeamPortion,
  teammateWork,
  type FireInput,
  type PortionChoice,
  type TeamActor,
} from "@/lib/team/leader-session";

export const dynamic = "force-dynamic";

function actorFromIdentity(identity: {
  membershipId: string;
  memberId: string;
  email: string;
  name: string;
  kind: string;
  orgId: string;
  orgSlug: string;
  stance: string;
}): TeamActor {
  return {
    membershipId: identity.membershipId,
    memberId: identity.memberId,
    email: identity.email,
    name: identity.name,
    kind: identity.kind,
    orgId: identity.orgId,
    orgSlug: identity.orgSlug,
    stance: identity.stance,
  };
}

async function loadMembership(membershipId: string): Promise<TeamActor | null> {
  const db = getDb();
  const [row] = await db
    .select({
      membershipId: memberships.id,
      memberId: members.id,
      email: members.email,
      name: members.name,
      kind: members.kind,
      orgId: organizations.id,
      orgSlug: organizations.slug,
      stance: memberships.stance,
    })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(memberships.id, membershipId))
    .limit(1);
  return row ?? null;
}

function jsonFail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: Request) {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return jsonFail(auth.error, auth.status);
    const actor = actorFromIdentity(auth.identity);
    if (actor.orgSlug !== SALES_SLUG || actor.orgSlug !== TEAM_ORG) {
      return jsonFail("wrong_org", 403);
    }
    if (actor.stance === "learner") {
      const work = teammateWork(actor, "work");
      if (!work.ok) return jsonFail(work.error, work.error === "portion_missing" ? 404 : 403);
      return NextResponse.json({
        ok: true,
        room: "team",
        buys: false,
        ownsPath: false,
        portion: work.record.portion,
      });
    }
    if (actor.stance !== "trainer") return jsonFail("leader_required", 403);
    const teammateMembershipId = new URL(request.url).searchParams.get("teammate")?.trim() || "";
    const held = readTeamPortion(teammateMembershipId);
    if (!held.ok) return jsonFail(held.error, held.error === "portion_missing" ? 404 : 400);
    return NextResponse.json({ ok: true, room: "team", events: held.events, record: held.record });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonFail("database_unavailable", 503);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return jsonFail(auth.error, auth.status);
    const leader = actorFromIdentity(auth.identity);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "fire").trim();
    if (action === "buy") return jsonFail("teammate_does_not_buy", 403);
    if (action === "own") return jsonFail("teammate_does_not_own_path", 403);
    if (action === "work") {
      const work = teammateWork(leader, "work");
      if (!work.ok) return jsonFail(work.error, 403);
      return NextResponse.json({
        ok: true,
        room: "team",
        buys: false,
        ownsPath: false,
        portion: work.record.portion,
      });
    }
    if (leader.stance !== "trainer" || leader.orgSlug !== TEAM_ORG) {
      return jsonFail("leader_required", 403);
    }
    const teammateMembershipId = String(body.teammateMembershipId || body.teammate || "").trim();
    const teammate = await loadMembership(teammateMembershipId);
    if (!teammate) return jsonFail("teammate_required", 404);
    const portion: PortionChoice = body.portion === "override" ? "override" : "lock";
    const goals = Array.isArray(body.goals) ? body.goals.filter((goal) => typeof goal === "string") : [];
    const input: FireInput = {
      goals,
      portion,
      overrideTitle: typeof body.overrideTitle === "string" ? body.overrideTitle : "",
    };
    const fired = fireLeaderSession(leader, teammate, input);
    if (!fired.ok) return jsonFail(fired.error, 400);
    const again = readTeamPortion(teammate.membershipId);
    if (!again.ok) return jsonFail(again.error, 500);
    return NextResponse.json({ ok: true, room: "team", events: again.events, record: again.record });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonFail("database_unavailable", 503);
    throw error;
  }
}
