import { COMPANY_NAME, UNI_NAME } from "./types";

export function coursePath(slug: string) {
  return `/c/${encodeURIComponent(slug)}`;
}

/** Public student URL — no query params, no campaign junk. */
export function courseShareUrl(origin: string, slug: string) {
  return `${origin.replace(/\/$/, "")}${coursePath(slug)}`;
}

export function courseShareText(title: string) {
  return `${title} — a ${COMPANY_NAME} course on ${UNI_NAME}. Watch the clip, do the field work, pass the exam.`;
}

export function safeReturnPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (
    next.startsWith("/login") ||
    next.startsWith("/office") ||
    next.startsWith("/api")
  ) {
    return "/";
  }
  return next;
}
