import { NextResponse } from "next/server";
import { eventsForCourse, reduceCourseProgress } from "@/lib/campus-runtime/events";
import { identityFromRequest } from "@/lib/campus-runtime/identity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const course = url.searchParams.get("course")?.trim() || "grok-bot";
  const result = await identityFromRequest();
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

  const rows = await eventsForCourse(result.identity, course);
  return NextResponse.json({
    authenticated: true,
    course,
    org: result.identity.orgSlug,
    membershipId: result.identity.membershipId,
    modules: reduceCourseProgress(rows),
  });
}
