import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { asLedgerAction, canReadLedger, canWriteLedger } from "@/lib/ledger/rules";
import { applyLedgerSqlIfConfigured } from "@/lib/ledger/sql";
import {
  LedgerAccessError,
  LedgerFieldsError,
  listProgressLedgers,
  markLedgerUnit,
  refreshProgressLedger,
} from "@/lib/ledger/store";
import { IntentAccessError } from "@/lib/intent/store";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireLedgerActor(request: Request, write: boolean) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  await applyLedgerSqlIfConfigured();
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    ...auth.identity,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)
      ?.features,
  };
  const allowed = write ? canWriteLedger(actor, staff) : canReadLedger(actor, staff);
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
  const gate = await requireLedgerActor(request, false);
  if (!gate.ok) return gate.response;
  const childMembershipId = childMembershipIdFrom(request);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  try {
    const listed = await listProgressLedgers({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: listed.current,
      completed: listed.completed,
      inProgress: listed.inProgress,
      recommended: listed.recommended,
      next: listed.next,
      versions: listed.versions,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof LedgerAccessError) {
      return deny(error.status, error.code);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const gate = await requireLedgerActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const childMembershipId = childMembershipIdFrom(request, body);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  try {
    const ledger = await refreshProgressLedger({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: ledger,
      completed: ledger.completed,
      inProgress: ledger.inProgress,
      recommended: ledger.recommended,
      next: ledger.next,
      ledger,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof LedgerAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof LedgerFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const gate = await requireLedgerActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const childMembershipId = childMembershipIdFrom(request, body);
  if (!childMembershipId) return deny(400, "child_membership_id_required");
  const action = asLedgerAction(body.action);
  if (!action) return deny(400, "invalid_action");
  try {
    const ledger = await markLedgerUnit({
      actor: gate.identity,
      childMembershipId,
      staff: gate.staff,
      action,
      body,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      childMembershipId,
      current: ledger,
      completed: ledger.completed,
      inProgress: ledger.inProgress,
      recommended: ledger.recommended,
      next: ledger.next,
      ledger,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof LedgerAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof LedgerFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}
