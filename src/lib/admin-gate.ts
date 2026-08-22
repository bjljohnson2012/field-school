import { isDeanEmail, type Role } from "@/lib/campus";

/** Client-set marker so middleware can refuse /admin without a staff session. */
export const ADMIN_GATE_COOKIE = "fsu_admin_gate";
export const ADMIN_GATE_VALUE = "1";

export function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function adminCookieIsValid(value: string | null | undefined) {
  return value === ADMIN_GATE_VALUE;
}

/** Signed-out browsers (no staff cookie) must never receive /admin HTML. */
export function signedOutAdminAccess(cookieValue: string | null | undefined) {
  return adminCookieIsValid(cookieValue) ? "allow" : "redirect";
}

export function loginRedirectForAdmin(pathname: string) {
  const next = isAdminRoute(pathname) ? pathname : "/admin";
  return `/login?next=${encodeURIComponent(next)}`;
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
