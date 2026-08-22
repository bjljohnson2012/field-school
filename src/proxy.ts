import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  ADMIN_GATE_COOKIE,
  isAdminRoute,
  loginRedirectForAdmin,
  signedOutAdminAccess,
} from "@/lib/admin-gate";
import { authIsConfigured } from "@/lib/auth/env";
import { isStaffEmail } from "@/lib/auth/staff";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminRoute(pathname)) return NextResponse.next();

  if (authIsConfigured()) {
    const session = await auth();
    if (session?.user?.email && isStaffEmail(session.user.email)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(
      new URL(loginRedirectForAdmin(pathname), request.url),
    );
  }

  const cookie = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  if (signedOutAdminAccess(cookie) === "allow") return NextResponse.next();

  return NextResponse.redirect(
    new URL(loginRedirectForAdmin(pathname), request.url),
  );
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
