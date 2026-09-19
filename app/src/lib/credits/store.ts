import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { creditLedger, credits, customerApiKeys, usageEvents } from "@/lib/db/schema";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { assertChildInHousehold, IntentAccessError } from "@/lib/intent/store";
import { unwrapCustomerSecret, WrapKeyError, wrapCustomerSecret } from "./crypto";
import {
  asCreditMode,
  asCreditUnits,
  asLedgerEventName,
  asNote,
  asOptionalId,
  asProvider,
  asUsageEventName,
  canReadCredits,
  canWriteCredits,
  directionForEvent,
  familyKindOrEmpty,
  moneyFieldsPresent,
  publicKeyMeta,
} from "./rules";

export class CreditsAccessError extends IntentAccessError {
  constructor(status: 403 | 404, code: string) {
    super(status, code);
    this.name = "CreditsAccessError";
  }
}

export class CreditsFieldsError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "CreditsFieldsError";
  }
}

export function publicCredit(row: typeof credits.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    parentMembershipId: row.parentMembershipId,
    growthUnitId: row.growthUnitId,
    childMembershipId: row.childMembershipId,
    mode: row.mode,
    status: row.status,
    units: row.units,
    createdAt: row.createdAt.toISOString(),
  };
}

export function publicLedger(row: typeof creditLedger.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    creditId: row.creditId,
    parentMembershipId: row.parentMembershipId,
    growthUnitId: row.growthUnitId,
    childMembershipId: row.childMembershipId,
    eventName: row.eventName,
    direction: row.direction,
    units: row.units,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function publicUsage(row: typeof usageEvents.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    creditId: row.creditId,
    parentMembershipId: row.parentMembershipId,
    growthUnitId: row.growthUnitId,
    childMembershipId: row.childMembershipId,
    eventName: row.eventName,
    units: row.units,
    createdAt: row.createdAt.toISOString(),
  };
}

async function currentAccount(orgId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.orgId, orgId), eq(credits.status, "current")))
    .limit(1);
  return row ?? null;
}

async function activeKey(orgId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(customerApiKeys)
    .where(and(eq(customerApiKeys.orgId, orgId), eq(customerApiKeys.status, "active")))
    .limit(1);
  return row ?? null;
}

async function assertOptionalChild(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  childMembershipId?: string;
}) {
  if (!opts.childMembershipId) return;
  await assertChildInHousehold({
    actor: opts.actor,
    childMembershipId: opts.childMembershipId,
    staff: opts.staff,
  });
}

function rejectMoney(body: Record<string, unknown>) {
  if (moneyFieldsPresent(body)) throw new CreditsFieldsError("amounts_wait_revenue");
}

function rejectBlockedKind(body: Record<string, unknown>) {
  const kind = familyKindOrEmpty(body.kind);
  if (kind === "blocked") throw new CreditsAccessError(403, "family_mode_only");
}

export async function ensureCreditAccount(opts: {
  actor: LearnerIdentity;
  staff: boolean;
}) {
  if (!canWriteCredits(opts.actor, opts.staff) && !canReadCredits(opts.actor, opts.staff)) {
    throw new CreditsAccessError(403, "household_guardian_only");
  }
  const existing = await currentAccount(opts.actor.orgId);
  if (existing) return existing;
  const db = getDb();
  const [created] = await db
    .insert(credits)
    .values({
      orgId: opts.actor.orgId,
      parentMembershipId: opts.actor.membershipId,
      mode: "platform",
      status: "current",
      units: 0,
    })
    .returning();
  if (!created) throw new CreditsFieldsError("invalid_mode");
  return created;
}

export async function listCredits(opts: {
  actor: LearnerIdentity;
  staff: boolean;
}) {
  const account = await ensureCreditAccount(opts);
  const db = getDb();
  const [ledger, usage, keys] = await Promise.all([
    db
      .select()
      .from(creditLedger)
      .where(and(eq(creditLedger.orgId, opts.actor.orgId), eq(creditLedger.creditId, account.id)))
      .orderBy(desc(creditLedger.createdAt))
      .limit(50),
    db
      .select()
      .from(usageEvents)
      .where(and(eq(usageEvents.orgId, opts.actor.orgId), eq(usageEvents.creditId, account.id)))
      .orderBy(desc(usageEvents.createdAt))
      .limit(50),
    db
      .select()
      .from(customerApiKeys)
      .where(eq(customerApiKeys.orgId, opts.actor.orgId))
      .orderBy(desc(customerApiKeys.createdAt))
      .limit(20),
  ]);
  return {
    account: publicCredit(account),
    ledger: ledger.map(publicLedger),
    usage: usage.map(publicUsage),
    keys: keys.map(publicKeyMeta),
  };
}

export async function writeCredits(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  body: Record<string, unknown>;
}) {
  if (!canWriteCredits(opts.actor, opts.staff)) {
    throw new CreditsAccessError(403, "household_guardian_only");
  }
  rejectMoney(opts.body);
  rejectBlockedKind(opts.body);
  const childMembershipId = asOptionalId(
    opts.body.childMembershipId ?? opts.body.child_membership_id,
  );
  const growthUnitId = asOptionalId(opts.body.growthUnitId ?? opts.body.growth_unit_id);
  await assertOptionalChild({ ...opts, childMembershipId: childMembershipId || undefined });
  const account = await ensureCreditAccount(opts);
  const nextMode = asCreditMode(opts.body.mode);
  const eventName = asLedgerEventName(opts.body.eventName ?? opts.body.event_name);
  const usageName = asUsageEventName(
    opts.body.usageEventName ??
      opts.body.usage_event_name ??
      (opts.body.usage && typeof opts.body.usage === "object"
        ? (opts.body.usage as Record<string, unknown>).eventName ??
          (opts.body.usage as Record<string, unknown>).event_name
        : undefined),
  );
  if (opts.body.mode != null && opts.body.mode !== "" && !nextMode) {
    throw new CreditsFieldsError("invalid_mode");
  }
  if ((opts.body.eventName ?? opts.body.event_name) && !eventName) {
    throw new CreditsFieldsError("invalid_event_name");
  }
  if (
    (opts.body.usageEventName ??
      opts.body.usage_event_name ??
      (opts.body.usage && typeof opts.body.usage === "object" ? true : false)) &&
    !usageName
  ) {
    throw new CreditsFieldsError("invalid_event_name");
  }
  const units = asCreditUnits(opts.body.units);
  if (units == null) throw new CreditsFieldsError("invalid_units");
  const usageUnits = asCreditUnits(
    opts.body.usage && typeof opts.body.usage === "object"
      ? (opts.body.usage as Record<string, unknown>).units
      : opts.body.usageUnits ?? opts.body.usage_units,
  );
  if (usageUnits == null) throw new CreditsFieldsError("invalid_units");
  const db = getDb();
  let current = account;
  if (nextMode && nextMode !== current.mode) {
    if (nextMode === "byok") {
      const key = await activeKey(opts.actor.orgId);
      if (!key) throw new CreditsFieldsError("byok_key_required");
    }
    const [updated] = await db
      .update(credits)
      .set({ mode: nextMode })
      .where(eq(credits.id, current.id))
      .returning();
    current = updated ?? current;
    await db.insert(creditLedger).values({
      orgId: opts.actor.orgId,
      creditId: current.id,
      parentMembershipId: opts.actor.membershipId,
      growthUnitId: growthUnitId || null,
      childMembershipId: childMembershipId || null,
      eventName: "mode_switch",
      direction: "grant",
      units: 0,
      note: nextMode,
    });
  }
  if (eventName) {
    if (eventName === "usage_burn" && current.mode === "byok") {
      throw new CreditsAccessError(403, "byok_monthly_only");
    }
    const direction = directionForEvent(eventName);
    const delta = direction === "burn" ? -units : units;
    const nextUnits = current.units + delta;
    if (nextUnits < 0) throw new CreditsFieldsError("insufficient_units");
    const [updated] = await db
      .update(credits)
      .set({ units: nextUnits })
      .where(eq(credits.id, current.id))
      .returning();
    current = updated ?? current;
    await db.insert(creditLedger).values({
      orgId: opts.actor.orgId,
      creditId: current.id,
      parentMembershipId: opts.actor.membershipId,
      growthUnitId: growthUnitId || null,
      childMembershipId: childMembershipId || null,
      eventName,
      direction,
      units,
      note: asNote(opts.body.note),
    });
  }
  if (usageName) {
    if (current.mode === "byok" && usageUnits > 0) {
      throw new CreditsAccessError(403, "byok_monthly_only");
    }
    await db.insert(usageEvents).values({
      orgId: opts.actor.orgId,
      creditId: current.id,
      parentMembershipId: opts.actor.membershipId,
      growthUnitId: growthUnitId || null,
      childMembershipId: childMembershipId || null,
      eventName: usageName,
      units: usageUnits,
    });
  }
  return listCredits(opts);
}

export async function listKeys(opts: { actor: LearnerIdentity; staff: boolean }) {
  await ensureCreditAccount(opts);
  const db = getDb();
  const rows = await db
    .select()
    .from(customerApiKeys)
    .where(eq(customerApiKeys.orgId, opts.actor.orgId))
    .orderBy(desc(customerApiKeys.createdAt));
  return { keys: rows.map(publicKeyMeta) };
}

export async function writeCustomerKey(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  body: Record<string, unknown>;
}) {
  if (!canWriteCredits(opts.actor, opts.staff)) {
    throw new CreditsAccessError(403, "household_guardian_only");
  }
  rejectMoney(opts.body);
  rejectBlockedKind(opts.body);
  const secret =
    (typeof opts.body.secret === "string" && opts.body.secret) ||
    (typeof opts.body.key === "string" && opts.body.key) ||
    "";
  if (!secret.trim()) throw new CreditsFieldsError("secret_required");
  let wrapped;
  try {
    wrapped = wrapCustomerSecret(secret);
  } catch (error) {
    if (error instanceof WrapKeyError) throw new CreditsFieldsError(error.code);
    throw error;
  }
  const account = await ensureCreditAccount(opts);
  const db = getDb();
  const current = await activeKey(opts.actor.orgId);
  if (current) {
    await db
      .update(customerApiKeys)
      .set({
        status: "revoked",
        revokedAt: new Date(),
        wrapIv: "",
        wrapTag: "",
        wrappedCiphertext: "",
      })
      .where(eq(customerApiKeys.id, current.id));
  }
  const [created] = await db
    .insert(customerApiKeys)
    .values({
      orgId: opts.actor.orgId,
      parentMembershipId: opts.actor.membershipId,
      creditId: account.id,
      provider: asProvider(opts.body.provider),
      status: "active",
      last4: wrapped.last4,
      fingerprint: wrapped.fingerprint,
      wrapAlg: wrapped.wrapAlg,
      wrapKid: wrapped.wrapKid,
      wrapIv: wrapped.wrapIv,
      wrapTag: wrapped.wrapTag,
      wrappedCiphertext: wrapped.wrappedCiphertext,
    })
    .returning();
  if (!created) throw new CreditsFieldsError("secret_invalid");
  if (account.mode !== "byok") {
    await db.update(credits).set({ mode: "byok" }).where(eq(credits.id, account.id));
    await db.insert(creditLedger).values({
      orgId: opts.actor.orgId,
      creditId: account.id,
      parentMembershipId: opts.actor.membershipId,
      eventName: "mode_switch",
      direction: "grant",
      units: 0,
      note: "byok",
    });
  }
  return { key: publicKeyMeta(created) };
}

export async function revokeCustomerKey(opts: {
  actor: LearnerIdentity;
  staff: boolean;
  keyId?: string;
}) {
  if (!canWriteCredits(opts.actor, opts.staff)) {
    throw new CreditsAccessError(403, "household_guardian_only");
  }
  const db = getDb();
  const current = opts.keyId
    ? (
        await db
          .select()
          .from(customerApiKeys)
          .where(
            and(eq(customerApiKeys.orgId, opts.actor.orgId), eq(customerApiKeys.id, opts.keyId)),
          )
          .limit(1)
      )[0]
    : await activeKey(opts.actor.orgId);
  if (!current) throw new CreditsAccessError(404, "key_not_found");
  const [revoked] = await db
    .update(customerApiKeys)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      wrapIv: "",
      wrapTag: "",
      wrappedCiphertext: "",
    })
    .where(eq(customerApiKeys.id, current.id))
    .returning();
  const account = await currentAccount(opts.actor.orgId);
  if (account?.mode === "byok") {
    await db.update(credits).set({ mode: "platform" }).where(eq(credits.id, account.id));
    await db.insert(creditLedger).values({
      orgId: opts.actor.orgId,
      creditId: account.id,
      parentMembershipId: opts.actor.membershipId,
      eventName: "mode_switch",
      direction: "grant",
      units: 0,
      note: "platform",
    });
  }
  return { key: revoked ? publicKeyMeta(revoked) : publicKeyMeta(current) };
}

/** Runtime unwrap for later callers. Not exposed on GET /api/keys. */
export async function unwrapActiveCustomerKey(opts: { orgId: string }) {
  const row = await activeKey(opts.orgId);
  if (!row || !row.wrappedCiphertext) return null;
  return unwrapCustomerSecret({
    wrapIv: row.wrapIv,
    wrapTag: row.wrapTag,
    wrappedCiphertext: row.wrappedCiphertext,
    wrapAlg: row.wrapAlg,
  });
}
