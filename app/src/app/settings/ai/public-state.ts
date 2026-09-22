export const ORG_AI_MODES = ["platform", "byok"] as const;

export type OrgAiMode = (typeof ORG_AI_MODES)[number];

/** Fields that must never appear in GET JSON for this page. */
export const KEY_MATERIAL_FIELDS = [
  "secret",
  "apiKey",
  "api_key",
  "wrapIv",
  "wrap_iv",
  "wrapTag",
  "wrap_tag",
  "wrappedCiphertext",
  "wrapped_ciphertext",
  "fingerprint",
  "ciphertext",
  "wrapAlg",
  "wrap_alg",
  "wrapKid",
  "wrap_kid",
] as const;

const PRICE_OR_CHARGE = [
  "amount",
  "price",
  "cents",
  "usd",
  "dollar",
  "dollars",
  "sku",
  "stripe",
  "stripePriceId",
  "stripe_price_id",
  "priceId",
  "price_id",
  "card",
  "charge",
  "payment",
  "paymentMethod",
  "payment_method",
  "checkout",
  "invoice",
] as const;

export type PublicAiKey = {
  provider: string;
  status: "active";
  last4: string;
};

export type PublicAiState = {
  ok: true;
  org: string;
  membershipId: string;
  mode: OrgAiMode;
  units: number;
  stored: boolean;
  key: PublicAiKey | null;
};

export function asOrgAiMode(value: unknown): OrgAiMode | "" {
  return value === "platform" || value === "byok" ? value : "";
}

export function rejectsPriceOrCharge(body: Record<string, unknown>) {
  return PRICE_OR_CHARGE.some((key) => {
    if (!(key in body)) return false;
    const value = body[key];
    return value != null && value !== "";
  });
}

export function safeProvider(value: unknown, secret = "") {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (secret && trimmed === secret.trim()) return "";
  if (!/^[a-z0-9._-]{1,32}$/i.test(trimmed)) return "";
  return trimmed;
}

export function safeLast4(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.length > 4 ? trimmed.slice(-4) : trimmed;
}

export function toPublicAiState(input: {
  org: string;
  membershipId: string;
  mode: string;
  units: number;
  stored: boolean;
  provider?: string;
  status?: string;
  last4?: string;
}): PublicAiState {
  const mode: OrgAiMode = input.mode === "byok" ? "byok" : "platform";
  const units =
    typeof input.units === "number" && Number.isInteger(input.units) && input.units >= 0
      ? input.units
      : 0;
  const last4 = safeLast4(input.last4);
  const active = input.status === "active" && last4.length > 0;
  return {
    ok: true,
    org: input.org,
    membershipId: input.membershipId,
    mode,
    units,
    stored: Boolean(input.stored),
    key: active
      ? {
          provider: safeProvider(input.provider),
          status: "active",
          last4,
        }
      : null,
  };
}

export function leaksKeyMaterial(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => leaksKeyMaterial(item));
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if ((KEY_MATERIAL_FIELDS as readonly string[]).includes(key)) {
      if (nested != null && nested !== "") return true;
    }
    if (leaksKeyMaterial(nested)) return true;
  }
  return false;
}
