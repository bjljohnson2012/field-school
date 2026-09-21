import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/campus-runtime/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  return NextResponse.json({
    ok: true,
    wave3: "LIVE",
    composer: "ready",
    authenticated: Boolean(user),
    sign_in_required: !user,
    catalog: "/api/composer/catalog",
    lessons: "/api/composer/lessons",
    teach: "/o/field-school/teach",
    distribute: false,
    launch: "CLOSED 0/8",
  });
}
