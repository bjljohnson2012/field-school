import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { canReadCredits, canWriteCredits } from "@/lib/credits/rules";
import { applyCreditsSqlIfConfigured } from "@/lib/credits/sql";
import {
  CreditsAccessError,
  CreditsFieldsError,
  listKeys,
  revokeCustomerKey,
  writeCustomerKey,
} from "@/lib/credits/store";
import { IntentAccessError } from "@/lib/intent/store";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireKeysActor(request: Request, write: boolean) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  await applyCreditsSqlIfConfigured();
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    ...auth.identity,
    features: auth.memberships.find((row) => row.membershipId === auth.identity.membershipId)
      ?.features,
  };
  const allowed = write ? canWriteCredits(actor, staff) : canReadCredits(actor, staff);
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

function keyIdFrom(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  return (
    url.searchParams.get("id")?.trim() ||
    (typeof body?.id === "string" && body.id.trim()) ||
    (typeof body?.keyId === "string" && body.keyId.trim()) ||
    (typeof body?.key_id === "string" && body.key_id.trim()) ||
    ""
  );
}

export async function GET(request: Request) {
  const gate = await requireKeysActor(request, false);
  if (!gate.ok) return gate.response;
  try {
    const listed = await listKeys({ actor: gate.identity, staff: gate.staff });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      ...listed,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof CreditsAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof CreditsFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const gate = await requireKeysActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  try {
    const written = await writeCustomerKey({
      actor: gate.identity,
      staff: gate.staff,
      body,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      ...written,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof CreditsAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof CreditsFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const gate = await requireKeysActor(request, true);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  try {
    const revoked = await revokeCustomerKey({
      actor: gate.identity,
      staff: gate.staff,
      keyId: keyIdFrom(request, body) || undefined,
    });
    return NextResponse.json({
      ok: true,
      mode: gate.mode,
      ...revoked,
    });
  } catch (error) {
    if (error instanceof IntentAccessError || error instanceof CreditsAccessError) {
      return deny(error.status, error.code);
    }
    if (error instanceof CreditsFieldsError) {
      return deny(400, error.code);
    }
    throw error;
  }
}
