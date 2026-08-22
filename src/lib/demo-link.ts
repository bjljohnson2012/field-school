import { createHash, timingSafeEqual } from "node:crypto";

export const DEMO_WALK_PATH = "/demo";
export const DEMO_TOKEN_QUERY = "token";

type DemoEnv = {
  DEMO_LINK_TOKEN?: string;
  AUTH_SECRET?: string;
  NEXTAUTH_SECRET?: string;
};

/** Secret that unlocks `/demo?token=`. Prefer `DEMO_LINK_TOKEN`. */
export function resolveDemoLinkToken(env: DemoEnv = process.env): string | null {
  const explicit = env.DEMO_LINK_TOKEN?.trim();
  if (explicit) return explicit;
  const secret = (env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "").trim();
  if (!secret) return null;
  return createHash("sha256")
    .update(`field-school-university:demo-link:${secret}`)
    .digest("hex")
    .slice(0, 32);
}

export function tokensMatch(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidDemoLinkToken(
  provided: string | null | undefined,
  env: DemoEnv = process.env,
): boolean {
  return tokensMatch(provided, resolveDemoLinkToken(env));
}

export function demoWalkPath(token: string): string {
  return `${DEMO_WALK_PATH}?${DEMO_TOKEN_QUERY}=${encodeURIComponent(token)}`;
}
