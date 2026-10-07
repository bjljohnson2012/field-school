import { NextResponse } from "next/server";
import { isStaffEmail } from "@/lib/auth/staff";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { GapAccessError, GapFieldsError } from "./errors.ts";
import type { GapActor } from "./rules.ts";
import { applyGapLoopSqlIfConfigured } from "./sql.ts";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID.test(value);
}

export async function gapContext(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: NextResponse.json({ ok: false, error: auth.error }, { status: auth.status }) };
  const ready = await applyGapLoopSqlIfConfigured();
  if (!ready) return { ok: false as const, response: NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 }) };
  const staff = isStaffEmail(auth.identity.email);
  const actor: GapActor = {
    kind: auth.identity.kind,
    stance: auth.identity.stance,
    orgSlug: auth.identity.orgSlug,
    orgId: auth.identity.orgId,
    membershipId: auth.identity.membershipId,
    memberId: auth.identity.memberId,
    mode: auth.identity.mode,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)?.features,
  };
  return { ok: true as const, actor, staff };
}

export function gapError(error: unknown) {
  if (error instanceof GapAccessError || error instanceof GapFieldsError) {
    return NextResponse.json({ ok: false, error: error.code }, { status: error.status });
  }
  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
  throw error;
}
