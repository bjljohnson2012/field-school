import { canReadIntent, canWriteIntent } from "../intent/rules.ts";
import { asGrowthKind, isFamilyFirstKind } from "../brain/rules.ts";

export const CREDIT_MODES = ["platform", "byok"] as const;
export const LEDGER_DIRECTIONS = ["grant", "burn"] as const;
export const LEDGER_EVENT_NAMES = ["monthly_grant", "usage_burn", "adjustment", "mode_switch"] as const;
export const USAGE_EVENT_NAMES = [
  "brain_write",
  "brain_sync",
  "intent_write",
  "curriculum_write",
  "portion_write",
  "ledger_write",
] as const;
export const KEY_STATUSES = ["active", "revoked"] as const;
export const BYOK_WRAP_ALG = "aes-256-gcm";
export const BYOK_WRAP_KID = "v1";

export type CreditMode = (typeof CREDIT_MODES)[number];
export type LedgerDirection = (typeof LEDGER_DIRECTIONS)[number];
export type LedgerEventName = (typeof LEDGER_EVENT_NAMES)[number];
export type UsageEventName = (typeof USAGE_EVENT_NAMES)[number];

export function canWriteCredits(
  actor: {
    kind: string;
    stance: string;
    orgSlug: string;
    mode?: string;
    features?: unknown;
  },
  staff: boolean,
) {
  return canWriteIntent(actor, staff);
}

export function canReadCredits(
  actor: {
    kind: string;
    stance: string;
    orgSlug: string;
    mode?: string;
    features?: unknown;
  },
  staff: boolean,
) {
  return canReadIntent(actor, staff);
}

export function asCreditMode(value: unknown): CreditMode | "" {
  return typeof value === "string" && (CREDIT_MODES as readonly string[]).includes(value)
    ? (value as CreditMode)
    : "";
}

export function asLedgerEventName(value: unknown): LedgerEventName | "" {
  return typeof value === "string" && (LEDGER_EVENT_NAMES as readonly string[]).includes(value)
    ? (value as LedgerEventName)
    : "";
}

export function asUsageEventName(value: unknown): UsageEventName | "" {
  return typeof value === "string" && (USAGE_EVENT_NAMES as readonly string[]).includes(value)
    ? (value as UsageEventName)
    : "";
}

export function asLedgerDirection(value: unknown): LedgerDirection | "" {
  return typeof value === "string" && (LEDGER_DIRECTIONS as readonly string[]).includes(value)
    ? (value as LedgerDirection)
    : "";
}

export function directionForEvent(eventName: LedgerEventName): LedgerDirection {
  if (eventName === "usage_burn") return "burn";
  if (eventName === "mode_switch") return "grant";
  return "grant";
}

export function asCreditUnits(value: unknown) {
  if (value == null || value === "") return 0;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 1_000_000_000) {
    return null;
  }
  return value;
}

export function asNote(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 400) : "";
}

export function asProvider(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export function asOptionalId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : "";
}

export function familyKindOrEmpty(value: unknown) {
  const kind = asGrowthKind(value);
  if (!kind) return "";
  return isFamilyFirstKind(kind) ? kind : "blocked";
}

export function moneyFieldsPresent(body: Record<string, unknown>) {
  const keys = [
    "amount",
    "price",
    "cents",
    "usd",
    "dollar",
    "dollars",
    "sku",
    "stripePriceId",
    "stripe_price_id",
    "priceId",
    "price_id",
  ];
  return keys.some((key) => key in body && body[key] != null && body[key] !== "");
}

export function last4FromSecret(secret: string) {
  const trimmed = secret.trim();
  return trimmed.length >= 4 ? trimmed.slice(-4) : trimmed;
}

export function publicKeyMeta(row: {
  id: string;
  orgId: string;
  parentMembershipId: string;
  creditId: string | null;
  provider: string;
  status: string;
  last4: string;
  fingerprint: string;
  wrapAlg: string;
  wrapKid: string;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: row.id,
    orgId: row.orgId,
    parentMembershipId: row.parentMembershipId,
    creditId: row.creditId,
    provider: row.provider,
    status: row.status,
    last4: row.last4,
    fingerprint: row.fingerprint,
    wrapAlg: row.wrapAlg,
    wrapKid: row.wrapKid,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
  };
}
