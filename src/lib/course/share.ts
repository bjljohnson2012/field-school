import { UNI_SHORT } from "./types";

export function coursePath(slug: string) {
  return `/c/${encodeURIComponent(slug)}`;
}

export function courseShareUrl(origin: string, slug: string) {
  return `${origin.replace(/\/$/, "")}${coursePath(slug)}`;
}

export function courseShareText(title: string) {
  return `${title} — a ${UNI_SHORT} course. Watch the clip, do the field work, pass the exam.`;
}

export function safeReturnPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.startsWith("/login") || next.startsWith("/office") || next.startsWith("/api")) {
    return "/";
  }
  return next;
}

/** After Google, X, or email sign-in, keep them on a campus account page. */
export function signedInReturnPath(next: string | null | undefined) {
  const dest = safeReturnPath(next);
  return dest === "/" ? "/dashboard" : dest;
}
