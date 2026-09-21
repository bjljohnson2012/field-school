import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffEmail } from "@/lib/auth/staff";
import {
  PUBLISH_POLISH_LOCKED_SHA256,
  readPublishPolish,
  recordPublishPolish,
} from "@/lib/player/publish-polish";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readPublishPolish());
}

export async function POST(request: Request) {
  const session = await auth().catch(() => null);
  const email = session?.user?.email ?? "";
  if (!isStaffEmail(email)) {
    return NextResponse.json({ ok: false, error: "operator_only" }, { status: 401 });
  }
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const result = recordPublishPolish({
    destSha256:
      (typeof body.dest_sha256 === "string" && body.dest_sha256) ||
      PUBLISH_POLISH_LOCKED_SHA256,
    distribute: body.distribute,
    actor: email,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result.evidence);
}
