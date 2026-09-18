import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/members/policy";

export type PublicSubmitBucket = "signup" | "access" | "forms";

export const PUBLIC_SUBMIT_WINDOW_MS = 10 * 60 * 1000;

export const PUBLIC_SUBMIT_LIMITS: Record<
  PublicSubmitBucket,
  { windowMs: number; max: number }
> = {
  signup: { windowMs: PUBLIC_SUBMIT_WINDOW_MS, max: 5 },
  access: { windowMs: PUBLIC_SUBMIT_WINDOW_MS, max: 5 },
  forms: { windowMs: PUBLIC_SUBMIT_WINDOW_MS, max: 8 },
};

const hits = new Map<string, number[]>();

export function isHoneypotSpam(website: unknown) {
  return typeof website === "string" && Boolean(website.trim());
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function takeRateLimit(
  key: string,
  limit: { windowMs: number; max: number },
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  const start = now - limit.windowMs;
  const prior = (hits.get(key) ?? []).filter((stamp) => stamp > start);
  if (prior.length >= limit.max) {
    hits.set(key, prior);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((prior[0]! + limit.windowMs - now) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  prior.push(now);
  hits.set(key, prior);
  return { ok: true };
}

export function resetRateLimits() {
  hits.clear();
}

function mergeHeaders(
  extra?: Record<string, string>,
  retryAfterSec?: number,
): HeadersInit {
  const headers = new Headers(extra);
  if (retryAfterSec !== undefined) {
    headers.set("Retry-After", String(retryAfterSec));
  }
  return headers;
}

export function honeypotOkResponse(headers?: Record<string, string>) {
  return NextResponse.json({ ok: true }, { headers });
}

export function rateLimitedResponse(
  retryAfterSec: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: "Too many attempts. Try again in a few minutes." },
    {
      status: 429,
      headers: mergeHeaders(headers, retryAfterSec),
    },
  );
}

export function guardPublicSubmit(
  request: Request,
  input: { website?: unknown; email?: unknown },
  bucket: PublicSubmitBucket,
  headers?: Record<string, string>,
): NextResponse | null {
  const limit = PUBLIC_SUBMIT_LIMITS[bucket];
  const ipHit = takeRateLimit(`${bucket}:ip:${clientIp(request)}`, limit);
  if (!ipHit.ok) return rateLimitedResponse(ipHit.retryAfterSec, headers);

  const email = normalizeEmail(
    typeof input.email === "string" ? input.email : "",
  );
  if (email) {
    const emailHit = takeRateLimit(`${bucket}:email:${email}`, limit);
    if (!emailHit.ok) return rateLimitedResponse(emailHit.retryAfterSec, headers);
  }

  if (isHoneypotSpam(input.website)) {
    return honeypotOkResponse(headers);
  }
  return null;
}
