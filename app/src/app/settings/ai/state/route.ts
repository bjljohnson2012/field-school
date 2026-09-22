import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { isStaffEmail } from "@/lib/auth/staff";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { wrapCustomerSecret, WrapKeyError } from "@/lib/credits/crypto";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { creditLedger, credits, customerApiKeys } from "@/lib/db/schema";
import { applyCreditsSqlIfConfigured } from "@/lib/credits/sql";
import {
  asOrgAiMode,
  leaksKeyMaterial,
  rejectsPriceOrCharge,
  safeProvider,
  toPublicAiState,
} from "../public-state";

export const dynamic = "force-dynamic";

const HIRER_STANCES = new Set(["admin", "guardian", "trainer"]);

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function sendPublic(state: ReturnType<typeof toPublicAiState>) {
  if (leaksKeyMaterial(state)) {
    return deny(500, "key_withheld");
  }
  return NextResponse.json(state);
}

async function requireHirer(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  const ready = await applyCreditsSqlIfConfigured();
  if (!ready) return { ok: false as const, response: deny(503, "credits_unavailable") };
  const staff = isStaffEmail(auth.identity.email);
  if (auth.identity.kind === "child") {
    return { ok: false as const, response: deny(403, "child_cannot_write") };
  }
  if (!staff && !HIRER_STANCES.has(auth.identity.stance)) {
    return { ok: false as const, response: deny(403, "hirer_only") };
  }
  return { ok: true as const, identity: auth.identity };
}

async function readOrg(orgId: string) {
  const db = getDb();
  const [account] = await db
    .select({
      id: credits.id,
      mode: credits.mode,
      units: credits.units,
    })
    .from(credits)
    .where(and(eq(credits.orgId, orgId), eq(credits.status, "current")))
    .limit(1);
  const [key] = await db
    .select({
      provider: customerApiKeys.provider,
      status: customerApiKeys.status,
      last4: customerApiKeys.last4,
    })
    .from(customerApiKeys)
    .where(and(eq(customerApiKeys.orgId, orgId), eq(customerApiKeys.status, "active")))
    .limit(1);
  return { account: account ?? null, key: key ?? null };
}

function publicFrom(identity: LearnerIdentity, row: Awaited<ReturnType<typeof readOrg>>) {
  return toPublicAiState({
    org: identity.orgSlug,
    membershipId: identity.membershipId,
    mode: row.account?.mode || "platform",
    units: row.account?.units ?? 0,
    stored: Boolean(row.account),
    provider: row.key?.provider,
    status: row.key?.status,
    last4: row.key?.last4,
  });
}

async function ensureAccount(identity: LearnerIdentity) {
  const current = await readOrg(identity.orgId);
  if (current.account) return current;
  const db = getDb();
  await db.insert(credits).values({
    orgId: identity.orgId,
    parentMembershipId: identity.membershipId,
    mode: "platform",
    status: "current",
    units: 0,
  });
  return readOrg(identity.orgId);
}

async function setMode(identity: LearnerIdentity, creditId: string, mode: "platform" | "byok") {
  const db = getDb();
  await db.update(credits).set({ mode }).where(eq(credits.id, creditId));
  await db.insert(creditLedger).values({
    orgId: identity.orgId,
    creditId,
    parentMembershipId: identity.membershipId,
    eventName: "mode_switch",
    direction: "grant",
    units: 0,
    note: mode,
  });
}

async function revokeActive(orgId: string) {
  const db = getDb();
  await db
    .update(customerApiKeys)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      wrapIv: "",
      wrapTag: "",
      wrappedCiphertext: "",
    })
    .where(and(eq(customerApiKeys.orgId, orgId), eq(customerApiKeys.status, "active")));
}

export async function GET(request: Request) {
  const gate = await requireHirer(request);
  if (!gate.ok) return gate.response;
  try {
    const row = await readOrg(gate.identity.orgId);
    return sendPublic(publicFrom(gate.identity, row));
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return deny(503, "credits_unavailable");
    throw error;
  }
}

export async function DELETE(request: Request) {
  const gate = await requireHirer(request);
  if (!gate.ok) return gate.response;
  try {
    const row = await ensureAccount(gate.identity);
    if (!row.account) return deny(503, "credits_unavailable");
    await revokeActive(gate.identity.orgId);
    if (row.account.mode === "byok") {
      await setMode(gate.identity, row.account.id, "platform");
    }
    const next = await readOrg(gate.identity.orgId);
    return sendPublic(publicFrom(gate.identity, next));
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return deny(503, "credits_unavailable");
    throw error;
  }
}

export async function POST(request: Request) {
  const gate = await requireHirer(request);
  if (!gate.ok) return gate.response;
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  if (rejectsPriceOrCharge(body)) return deny(400, "no_new_price");
  const action = body.action === "revoke" ? "revoke" : "save";
  if (action === "revoke") return DELETE(request);
  const mode = asOrgAiMode(body.mode);
  if (!mode) return deny(400, "invalid_mode");
  const secret =
    (typeof body.secret === "string" && body.secret) ||
    (typeof body.key === "string" && body.key) ||
    "";
  try {
    const row = await ensureAccount(gate.identity);
    if (!row.account) return deny(503, "credits_unavailable");
    if (mode === "byok") {
      if (secret.trim()) {
        const wrapped = wrapCustomerSecret(secret);
        const provider = safeProvider(body.provider, secret);
        const db = getDb();
        await revokeActive(gate.identity.orgId);
        await db.insert(customerApiKeys).values({
          orgId: gate.identity.orgId,
          parentMembershipId: gate.identity.membershipId,
          creditId: row.account.id,
          provider,
          status: "active",
          last4: wrapped.last4,
          fingerprint: wrapped.fingerprint,
          wrapAlg: wrapped.wrapAlg,
          wrapKid: wrapped.wrapKid,
          wrapIv: wrapped.wrapIv,
          wrapTag: wrapped.wrapTag,
          wrappedCiphertext: wrapped.wrappedCiphertext,
        });
      } else if (!row.key) {
        return deny(400, "byok_key_required");
      }
      if (row.account.mode !== "byok") {
        await setMode(gate.identity, row.account.id, "byok");
      }
    } else if (row.account.mode !== "platform") {
      await setMode(gate.identity, row.account.id, "platform");
    }
    const next = await readOrg(gate.identity.orgId);
    return sendPublic(publicFrom(gate.identity, next));
  } catch (error) {
    if (error instanceof WrapKeyError) {
      const status = error.code === "wrap_key_missing" || error.code === "wrap_key_invalid" ? 503 : 400;
      return deny(status, error.code);
    }
    if (error instanceof DatabaseUnavailableError) return deny(503, "credits_unavailable");
    throw error;
  }
}
