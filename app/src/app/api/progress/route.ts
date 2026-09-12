import { NextResponse } from "next/server";
import { eventsForCourse, reduceCourseProgress } from "@/lib/campus-runtime/events";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { courseAllowedInOrg } from "@/lib/campus-runtime/org";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const course = url.searchParams.get("course")?.trim() || "grok-bot";
  const result = await identityFromRequest(request);
  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json({
        authenticated: false,
        guest: true,
        course,
        modules: {},
      });
    }
    return NextResponse.json({ authenticated: false, error: result.error }, { status: 503 });
  }

  if (!courseAllowedInOrg(result.identity.orgSlug, course)) {
    return NextResponse.json({
      authenticated: true,
      course,
      org: result.identity.orgSlug,
      membershipId: result.identity.membershipId,
      modules: {},
    });
  }
  const rows = await eventsForCourse(result.identity, course);
  return NextResponse.json({
    authenticated: true,
    course,
    org: result.identity.orgSlug,
    membershipId: result.identity.membershipId,
    modules: reduceCourseProgress(rows),
  });
}
