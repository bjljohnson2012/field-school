import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { BYOK_WRAP_ALG, BYOK_WRAP_KID, last4FromSecret } from "./rules";

export class WrapKeyError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "WrapKeyError";
  }
}

export type WrappedSecret = {
  wrapAlg: typeof BYOK_WRAP_ALG;
  wrapKid: typeof BYOK_WRAP_KID;
  wrapIv: string;
  wrapTag: string;
  wrappedCiphertext: string;
  last4: string;
  fingerprint: string;
};

function decodeWrapKey(raw: string) {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, "hex");
  try {
    const buf = Buffer.from(trimmed, "base64");
    if (buf.length === 32) return buf;
  } catch {
    // fall through
  }
  return null;
}

export function wrapKeyFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.BYOK_WRAP_KEY?.trim() || "";
  if (!raw) throw new WrapKeyError("wrap_key_missing");
  const key = decodeWrapKey(raw);
  if (!key) throw new WrapKeyError("wrap_key_invalid");
  return key;
}

export function fingerprintSecret(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function wrapCustomerSecret(
  secret: string,
  env: NodeJS.ProcessEnv = process.env,
): WrappedSecret {
  const trimmed = secret.trim();
  if (!trimmed) throw new WrapKeyError("secret_required");
  if (trimmed.length < 8 || trimmed.length > 4000) throw new WrapKeyError("secret_invalid");
  const key = wrapKeyFromEnv(env);
  const iv = randomBytes(12);
  const cipher = createCipheriv(BYOK_WRAP_ALG, key, iv);
  const ciphertext = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    wrapAlg: BYOK_WRAP_ALG,
    wrapKid: BYOK_WRAP_KID,
    wrapIv: iv.toString("base64"),
    wrapTag: tag.toString("base64"),
    wrappedCiphertext: ciphertext.toString("base64"),
    last4: last4FromSecret(trimmed),
    fingerprint: fingerprintSecret(trimmed),
  };
}

export function unwrapCustomerSecret(
  wrapped: {
    wrapIv: string;
    wrapTag: string;
    wrappedCiphertext: string;
    wrapAlg?: string;
  },
  env: NodeJS.ProcessEnv = process.env,
) {
  if ((wrapped.wrapAlg || BYOK_WRAP_ALG) !== BYOK_WRAP_ALG) {
    throw new WrapKeyError("wrap_alg_unsupported");
  }
  const key = wrapKeyFromEnv(env);
  const decipher = createDecipheriv(
    BYOK_WRAP_ALG,
    key,
    Buffer.from(wrapped.wrapIv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(wrapped.wrapTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(wrapped.wrappedCiphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
