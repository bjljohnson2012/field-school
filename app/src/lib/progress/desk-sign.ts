import { createHmac, timingSafeEqual } from "node:crypto";

export function progressDeskSecret() {
  return process.env.PROGRESS_DESK_SECRET?.trim() || "";
}

export function signProgressDesk(org: string, secret: string) {
  return createHmac("sha256", secret).update(`org:${org}`).digest("base64url");
}

export function signedOrgFromUrl(url: URL, secret: string) {
  const org = url.searchParams.get("org")?.trim() || "";
  const sig = url.searchParams.get("sig")?.trim() || "";
  if (!org || !sig || !secret) return null;
  const expected = signProgressDesk(org, secret);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;
  return org;
}

export type DeskOpen =
  | { ok: true; org: string; via: "signed_url" | "session" }
  | { ok: false; status: 401 | 403 | 404 | 503; error: string };

export function admitDesk(input: {
  signedOrg: string | null;
  session:
    | { ok: true; orgId: string; orgSlug: string }
    | { ok: false; status: 401 | 403 | 404 | 503; error: string };
  asked: string;
}): DeskOpen {
  if (input.signedOrg) return { ok: true, org: input.signedOrg, via: "signed_url" };
  if (!input.session.ok) return input.session;
  if (input.asked && input.asked !== input.session.orgId && input.asked !== input.session.orgSlug) {
    return { ok: false, status: 403, error: "forbidden_org" };
  }
  return { ok: true, org: input.session.orgSlug, via: "session" };
}
