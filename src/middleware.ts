import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_GATE_COOKIE,
  isAdminRoute,
  loginRedirectForAdmin,
  signedOutAdminAccess,
} from "@/lib/admin-gate";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminRoute(pathname)) return NextResponse.next();

  const cookie = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  if (signedOutAdminAccess(cookie) === "allow") return NextResponse.next();

  return NextResponse.redirect(
    new URL(loginRedirectForAdmin(pathname), request.url),
  );
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
