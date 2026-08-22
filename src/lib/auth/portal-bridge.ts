import { ADMIN_ID, DEAN_NAME, isDeanEmail } from "@/lib/campus";
import { adminGateCookieWrite } from "@/lib/admin-gate";
import { PORTAL_KEY } from "@/lib/brand";
import { isStaffEmail } from "@/lib/auth/staff";
import { loadPortal, type PortalState } from "@/lib/portal";

/**
 * Attach the dean seat after a verified OAuth session (never from a bare button).
 * Returns false when the email is not on the staff allowlist.
 */
export function activateStaffFromOAuth(
  email: string,
  name?: string | null,
): boolean {
  if (typeof window === "undefined") return false;
  const mail = email.trim();
  if (!isStaffEmail(mail)) return false;

  const state = loadPortal();
  const dean = state.users.find((u) => u.id === ADMIN_ID || isDeanEmail(u.email));
  const displayName =
    name?.trim() ||
    (dean && dean.name !== "Maya Chen" ? dean.name : DEAN_NAME);

  const next: PortalState = {
    ...state,
    activeUserId: ADMIN_ID,
    impersonatorId: null,
    users: state.users.map((u) =>
      u.id === ADMIN_ID || isDeanEmail(u.email)
        ? { ...u, name: displayName, email: mail, role: "admin" as const }
        : u,
    ),
  };

  localStorage.setItem(PORTAL_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("fsu-portal"));
  adminGateCookieWrite(true);
  return true;
}
