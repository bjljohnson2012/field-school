import { isDeanEmail, type Role } from "@/lib/campus";

/**
 * Legacy client-set marker for the browser-only demo portal UI (nav state
 * only). Forgeable by design (plain, non-httpOnly, written from
 * `localStorage` state) — the /admin proxy must never treat this as proof
 * of a staff session. Server-side staff checks always go through
 * `edgeAuth()` + `isStaffSession()`.
 */
export const ADMIN_GATE_COOKIE = "fsu_admin_gate";
export const ADMIN_GATE_VALUE = "1";

export function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function loginRedirectForAdmin(pathname: string) {
  const next = isAdminRoute(pathname) ? pathname : "/admin";
  return `/login?next=${encodeURIComponent(next)}`;
}

/** Member sign-in can return to a campus path such as an assessment. */
export function safeMemberNext(next?: string | null) {
  const value = (next ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.includes("\\") || value.includes("://")) return "/dashboard";
  if (isAdminRoute(value)) return "/dashboard";
  return value;
}

/** Local name/email sign-in must never attach or mint the dean seat. */
export function sanitizeLocalSignInEmail(email?: string | null) {
  const mail = (email ?? "").trim();
  if (!mail || isDeanEmail(mail)) return "";
  return mail;
}

export function canReuseUserForLocalSignIn(
  user: { role: Role; email: string },
  email: string,
) {
  if (!email) return false;
  if (user.role === "admin") return false;
  if (isDeanEmail(email) || isDeanEmail(user.email)) return false;
  return user.email.trim().toLowerCase() === email.toLowerCase();
}

export function adminGateCookieWrite(hasStaffSession: boolean) {
  if (typeof document === "undefined") return;
  if (hasStaffSession) {
    document.cookie = `${ADMIN_GATE_COOKIE}=${ADMIN_GATE_VALUE}; path=/; SameSite=Lax`;
    return;
  }
  document.cookie = `${ADMIN_GATE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
