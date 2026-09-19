import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { canReadCurriculum, canWriteCurriculum, asPathAction, asPrompt } from "@/lib/curriculum/rules";
import { applyCurriculumSqlIfConfigured } from "@/lib/curriculum/sql";
import {
  CurriculumAccessError,
  CurriculumFieldsError,
  acceptCurriculumPath,
  editCurriculumPath,
  listCurriculumPaths,
  proposeCurriculumPath,
} from "@/lib/curriculum/store";
import { IntentAccessError } from "@/lib/intent/store";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireCurriculumActor(request: Request, write: boolean) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  await applyCurriculumSqlIfConfigured();
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    ...auth.identity,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)
      ?.features,
  };
  const allowed = write ? canWriteCurriculum(actor, staff) : canReadCurriculum(actor, staff);
  if (!allowed) {
    const error =
      auth.identity.kind === "child"
        ? "child_cannot_write"
        : auth.identity.orgSlug !== "household"
          ? "family_mode_only"
          : "household_guardian_only";
    return { ok: false as const, response: deny(403, error) };
  }
  return { ok: true as const, identity: auth.identity, staff, mode: actor.mode ?? "none" };
}

function childMembershipIdFrom(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("child_membership_id")?.trim() || "";
  const fromBody =
    (typeof body?.childMembershipId === "string" && body.childMembershipId.trim()) ||
    (typeof body?.child_membership_id === "string" && body.child_membership_id.trim()) ||
    (typeof body?.membershipId === "string" && body.membershipId.trim()) ||
    (typeof body?.membership_id === "string" && body.membership_id.trim()) ||
    "";
  return fromQuery || fromBody;
}

export async function GET(request: Request) {
  const gate = await requireCurriculumActor(request, false);
  if (!gate.ok) return gate.response;
  const childMembershipId = childMembershipIdFrom(request);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  try {
    const listed = await listCurriculumPaths({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: listed.current,
      assigned: listed.assigned,
      versions: listed.versions,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof CurriculumAccessError) {
      return deny(error.status, error.code);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const gate = await requireCurriculumActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const childMembershipId = childMembershipIdFrom(request, body);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  try {
    const path = await proposeCurriculumPath({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
      prompt: asPrompt(body.prompt),
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: path,
      assigned: path.status === "accepted" ? path : null,
      path,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof CurriculumAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof CurriculumFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const gate = await requireCurriculumActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const childMembershipId = childMembershipIdFrom(request, body);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  const action = asPathAction(body.action);
  if (!action) return deny(400, "invalid_action");
  if (action === "re-prompt" && !asPrompt(body.prompt)) return deny(400, "prompt_required");
  try {
    const path =
      action === "accept"
        ? await acceptCurriculumPath({
            actor: gate.identity,
            childMembershipId,
            staff: gate.staff,
            pathId: typeof body.pathId === "string" ? body.pathId : undefined,
          })
        : action === "edit"
          ? await editCurriculumPath({
              actor: gate.identity,
              childMembershipId,
              staff: gate.staff,
              body,
            })
          : await proposeCurriculumPath({
              actor: gate.identity,
              childMembershipId,
              staff: gate.staff,
              prompt: asPrompt(body.prompt),
            });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: path,
      assigned: path.status === "accepted" ? path : null,
      path,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof CurriculumAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof CurriculumFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}
