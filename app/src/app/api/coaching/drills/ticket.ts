import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const TICKET_TTL_MS = 30 * 60 * 1000;

export type DrillTicket = {
  membershipId: string;
  skillCategory: string;
  scenario: string;
  expectedBehaviors: string[];
  trapBehaviors: string[];
  rubric: string;
  exp: number;
};

export function drillTicketSecret(env: { AUTH_SECRET?: string; NEXTAUTH_SECRET?: string } = process.env): string {
  return (env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "").trim();
}

function key(secret: string) {
  return createHash("sha256").update(`field-school:drill-ticket:${secret}`).digest();
}

export function sealDrillTicket(ticket: DrillTicket, secret: string): string {
  if (!secret.trim()) throw new Error("ticket_secret_missing");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(ticket), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, body]).toString("base64url");
}

export function openDrillTicket(token: string, secret: string, now = Date.now()): DrillTicket | null {
  if (!secret.trim() || !token) return null;
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < 30) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const body = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(json) as Partial<DrillTicket>;
    if (typeof parsed.membershipId !== "string" || typeof parsed.skillCategory !== "string") return null;
    if (typeof parsed.scenario !== "string" || !parsed.scenario.trim()) return null;
    if (typeof parsed.rubric !== "string") return null;
    if (!Array.isArray(parsed.expectedBehaviors) || !Array.isArray(parsed.trapBehaviors)) return null;
    if (typeof parsed.exp !== "number" || parsed.exp < now) return null;
    return {
      membershipId: parsed.membershipId,
      skillCategory: parsed.skillCategory,
      scenario: parsed.scenario,
      expectedBehaviors: parsed.expectedBehaviors.filter((item): item is string => typeof item === "string"),
      trapBehaviors: parsed.trapBehaviors.filter((item): item is string => typeof item === "string"),
      rubric: parsed.rubric,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
