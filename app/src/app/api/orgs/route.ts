import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { setActiveOrgCookie } from "@/lib/campus-runtime/org";
import { loginAllowed } from "@/lib/tenancy/access";
import { ensureRoomOrg } from "@/lib/tenancy/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (!loginAllowed({ kind: auth.identity.kind })) {
    return NextResponse.json({ ok: false, error: "child_has_no_login" }, { status: 403 });
  }
  let body: { room?: unknown; name?: unknown; homeschoolMode?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const room = body.room === "family" || body.room === "team" ? body.room : null;
  if (!room) return NextResponse.json({ ok: false, error: "room_required" }, { status: 400 });
  const name = typeof body.name === "string" ? body.name : undefined;
  const org = await ensureRoomOrg(
    { id: auth.identity.memberId, name: auth.identity.name },
    room,
    { name, homeschoolMode: body.homeschoolMode === true },
  );
  await setActiveOrgCookie(org.slug);
  return NextResponse.json({
    ok: true,
    org: { slug: org.slug, name: org.name, kind: org.kind, homeschoolMode: org.homeschoolMode },
  });
}
