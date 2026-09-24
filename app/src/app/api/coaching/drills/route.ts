import { NextResponse } from "next/server";
import { generateDrillPrompt } from "@/lib/ai/prompts/drills";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { loadImproveDesk } from "./load";
import { foreignSubject, skillsForShape } from "./math";
import { insertDrillAttempt, recordSubjectDrill } from "./persist";
import { drillTicketSecret, openDrillTicket, sealDrillTicket, TICKET_TTL_MS } from "./ticket";
import { DrillWriteError, recordDrillAttempt } from "./write";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readJson(request: Request) {
  try {
    const raw = await request.text();
    if (!raw.trim()) return {} as Record<string, unknown>;
    const body = JSON.parse(raw) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);
  if (auth.identity.kind === "child") return jsonError("subject_only", 403);
  const url = new URL(request.url);
  const requestedMember = url.searchParams.get("membershipId")?.trim() ?? "";
  if (requestedMember && requestedMember !== auth.identity.membershipId) {
    return jsonError("subject_only", 403);
  }
  let desk;
  try {
    desk = await loadImproveDesk(auth.identity);
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
  if (!desk.open) return jsonError("forbidden", 403);
  const skillCategory = url.searchParams.get("skill")?.trim() ?? "";
  if (!skillCategory) {
    return NextResponse.json({
      ok: true,
      label: desk.label,
      skills: desk.skills,
      stats: desk.stats,
    });
  }
  const skill = skillsForShape(desk.shape).find((item) => item.slug === skillCategory);
  if (!skill) return jsonError("unknown_skill", 400);
  const secret = drillTicketSecret();
  if (!secret) return jsonError("ticket_secret_missing", 503);
  try {
    const drill = await generateDrillPrompt({
      shape: desk.shape,
      skillCategory,
      skillLabel: skill.name,
      rubric: desk.rubricBySkill[skillCategory] ?? skill.name,
      recentScenarios: desk.recentBySkill[skillCategory] ?? [],
      orgName: desk.orgName,
    });
    if (!drill.scenario.trim()) return jsonError("ai_unavailable", 502);
    const ticket = sealDrillTicket(
      {
        membershipId: auth.identity.membershipId,
        skillCategory,
        scenario: drill.scenario,
        expectedBehaviors: drill.expectedBehaviors,
        trapBehaviors: drill.trapBehaviors,
        rubric: desk.rubricBySkill[skillCategory] ?? skill.name,
        exp: Date.now() + TICKET_TTL_MS,
      },
      secret,
    );
    return NextResponse.json({
      ok: true,
      skill: { category: skillCategory, label: skill.name },
      scenario: drill.scenario,
      ticket,
    });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    return jsonError("ai_unavailable", 502);
  }
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const auth = await identityFromRequest(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);
  if (auth.identity.kind === "child") return jsonError("subject_only", 403);
  const body = await readJson(request);
  if (!body) return jsonError("invalid_json", 400);
  if (foreignSubject(auth.identity.membershipId, body)) return jsonError("subject_only", 403);
  const skillCategory = text(body.skillCategory);
  const userResponse = text(body.userResponse);
  const token = text(body.ticket);
  const secret = drillTicketSecret();
  if (!secret) return jsonError("ticket_secret_missing", 503);
  const ticket = openDrillTicket(token, secret);
  if (!ticket || ticket.membershipId !== auth.identity.membershipId || ticket.skillCategory !== skillCategory) {
    return jsonError("invalid_ticket", 400);
  }
  try {
    const desk = await loadImproveDesk(auth.identity);
    if (!desk.open) return jsonError("forbidden", 403);
    const skill = skillsForShape(desk.shape).find((item) => item.slug === skillCategory);
    if (!skill) return jsonError("unknown_skill", 400);
    const saved = await recordDrillAttempt(
      {
        subject: auth.identity,
        skillCategory,
        scenario: ticket.scenario,
        expectedBehaviors: ticket.expectedBehaviors,
        trapBehaviors: ticket.trapBehaviors,
        rubric: ticket.rubric,
        userResponse,
        requestedMembershipId: text(body.membershipId) || null,
      },
      {
        insertAttempt: insertDrillAttempt,
        recordEvent: recordSubjectDrill,
      },
    );
    const after = await loadImproveDesk(auth.identity);
    return NextResponse.json({
      ok: true,
      attemptId: saved.id,
      score: saved.grade.score,
      pointsAwarded: saved.pointsAwarded,
      summary: saved.grade.summary,
      didWell: saved.grade.didWell,
      toImprove: saved.grade.toImprove,
      improvedExample: saved.grade.improvedExample,
      expectedBehaviors: ticket.expectedBehaviors,
      trapBehaviors: ticket.trapBehaviors,
      stats: after.stats,
    });
  } catch (error) {
    if (error instanceof DrillWriteError) {
      const status = error.code === "subject_only" ? 403 : 400;
      return jsonError(error.code, status);
    }
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    return jsonError("ai_unavailable", 502);
  }
}
