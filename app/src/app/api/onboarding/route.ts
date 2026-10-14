import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import type { GapActor } from "@/lib/gap-loop/rules";
import { individualPlanEnabled } from "@/lib/individual/config";
import { roomLabelMap } from "@/lib/individual/surface";
import {
  advance,
  homeLanding,
  individualBranch,
  inviteEntryStep,
  KID_INTAKE,
  openInvite,
  openSignup,
  profileNudge,
  progressOf,
  shouldResume,
  STARTER_LESSON,
  switcherLabel,
  type FlowAction,
  type FlowSnapshot,
} from "@/lib/onboarding/graph";
import {
  applyHomeschoolMode,
  applyOrgName,
  applyRoomChoice,
  bindBrain,
  bindOutcome,
  loadOnboarding,
  saveOnboarding,
  staffFor,
  syncAdultGates,
} from "@/lib/onboarding/store";

export const dynamic = "force-dynamic";

function payload(flow: FlowSnapshot, pathname: string) {
  return {
    ok: true,
    flow,
    nudge: profileNudge(flow),
    resume: shouldResume(pathname, flow),
    switcher: switcherLabel(flow),
    progress: progressOf(flow),
    rooms: individualBranch(individualPlanEnabled()),
    roomLabels: roomLabelMap(),
    kidIntake: KID_INTAKE,
    starter: STARTER_LESSON,
    landing: homeLanding(flow),
    inviteEntry: inviteEntryStep(flow.brainNamed),
  };
}

function isAction(value: unknown): value is FlowAction {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && type !== "open";
}

export async function GET(request: Request) {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const url = new URL(request.url);
    const pathname = url.searchParams.get("path") || "";
    const flow = await loadOnboarding(auth.identity.memberId);
    if (!flow) return NextResponse.json({ ok: true, flow: null, resume: false, nudge: null });
    return NextResponse.json(payload(flow, pathname));
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    const member = { id: auth.identity.memberId, name: auth.identity.name };
    let flow = await loadOnboarding(member.id);
    if (!flow) {
      if (body.entry === "invite") {
        const db = getDb();
        const [org] = await db.select().from(organizations).where(eq(organizations.id, auth.identity.orgId)).limit(1);
        flow = openInvite({
          accountId: member.id,
          invitingOrgId: auth.identity.orgId,
          brainNamed: Boolean(org?.name?.trim()),
        });
      } else {
        flow = openSignup(member.id);
      }
    }
    if (flow.entry === "invite") {
      flow = {
        ...flow,
        orgId: flow.orgId || auth.identity.orgId,
        invitingOrgId: flow.invitingOrgId || auth.identity.orgId,
        membershipId: flow.membershipId || auth.identity.membershipId,
      };
    }
    const action = isAction(body.action) ? body.action : null;
    if (action) {
      const stepped = advance(flow, action);
      if (!stepped.ok) return NextResponse.json({ ok: false, error: stepped.error }, { status: 400 });
      flow = stepped.flow;
      if (action.type === "brain-name" && flow.entry === "signup") {
        flow = await bindBrain(flow, member, flow.brainName);
      }
      if (action.type === "room" && flow.orgId && (action.room === "family" || action.room === "team")) {
        await applyRoomChoice(flow.orgId, action.room);
      }
      if (action.type === "org-name" && flow.orgId) await applyOrgName(flow.orgId, flow.orgName);
      if (action.type === "homeschool-mode" && flow.orgId && flow.homeschoolMode !== null) {
        await applyHomeschoolMode(flow.orgId, flow.homeschoolMode);
      }
      if (action.type === "adult-gates") await syncAdultGates(member, flow.adultGates);
      if (action.type === "first-goal" && flow.orgId && flow.membershipId) {
        const actor: GapActor = {
          kind: auth.identity.kind,
          stance: auth.identity.stance,
          orgSlug: auth.identity.orgSlug,
          orgId: flow.orgId,
          membershipId: flow.membershipId,
          memberId: auth.identity.memberId,
        };
        flow = await bindOutcome(flow, actor, staffFor(auth.identity.email));
      }
    }
    const actor =
      flow.orgId && flow.membershipId
        ? { orgId: flow.orgId, membershipId: flow.membershipId, stance: auth.identity.stance }
        : null;
    await saveOnboarding(flow, actor);
    return NextResponse.json(payload(flow, ""));
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
}
