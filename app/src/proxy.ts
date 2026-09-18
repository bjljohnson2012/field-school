import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRoute, loginRedirectForAdmin } from "@/lib/admin-gate";
import { edgeAuth } from "@/lib/auth/edge-auth";
import { isStaffSession } from "@/lib/members/policy";

/**
 * A real staff session is required for /admin in every deploy shape,
 * credentials-only (AUTH_SECRET set, no Google/Twitter) included. There is
 * no client-writable cookie fallback: a forged `fsu_admin_gate` cookie must
 * never open this route, whether or not OAuth env is configured.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminRoute(pathname)) return NextResponse.next();

  const session = await edgeAuth();
  if (isStaffSession(session)) {
    return NextResponse.next();
  }
  if (session?.user) {
    const access = new URL("/request-access", request.url);
    access.searchParams.set("from", "admin");
    return NextResponse.redirect(access);
  }
  return NextResponse.redirect(
    new URL(loginRedirectForAdmin(pathname), request.url),
  );
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
