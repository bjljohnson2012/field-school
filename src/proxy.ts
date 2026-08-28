import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_GATE_COOKIE,
  isAdminRoute,
  loginRedirectForAdmin,
  signedOutAdminAccess,
} from "@/lib/admin-gate";
import { edgeAuth } from "@/lib/auth/edge-auth";
import { authIsConfigured } from "@/lib/auth/env";
import { isStaffSession } from "@/lib/members/policy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminRoute(pathname)) return NextResponse.next();

  if (authIsConfigured()) {
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

  const cookie = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  if (signedOutAdminAccess(cookie) === "allow") return NextResponse.next();

  return NextResponse.redirect(
    new URL(loginRedirectForAdmin(pathname), request.url),
  );
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
