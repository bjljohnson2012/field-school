import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { isStaffSession, isValidEmail, normalizeEmail } from "@/lib/members/policy";
import { countAdultAssessments } from "@/lib/tools/results-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Staff-only count. Stored rows stay on the server. */
export async function GET(request: Request) {
  const session = await auth();
  if (!isStaffSession(session)) {
    return NextResponse.json({ ok: false, error: "staff_session_required" }, { status: 401 });
  }
  const email = new URL(request.url).searchParams.get("email");
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "bad_email" }, { status: 400 });
  }
  try {
    const count = await countAdultAssessments(normalizeEmail(email));
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
    }
    throw error;
  }
}
