import { NextResponse } from "next/server";
import { adultOnly, unavailable } from "@/lib/assessments/actor";
import { loadHomeCourse } from "@/lib/profile/public-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const course = await loadHomeCourse(auth.actor.owner.memberId, auth.actor.orgSlug);
    if (!course) return NextResponse.json({ ok: true, from: "", title: "", href: "", courseSlug: "" });
    return NextResponse.json({ ok: true, ...course });
  } catch (error) {
    return unavailable(error);
  }
}
