import { NextResponse } from "next/server";
import { loadSession } from "@/lib/campus-runtime/identity";
import { setActiveOrgCookie } from "@/lib/campus-runtime/org";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await loadSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "sign_in_required" }, { status: 401 });
  }
  let body: { slug?: string };
  try {
    body = (await request.json()) as { slug?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const slug = body.slug?.trim() || "";
  const row = session.rows.find((r) => r.orgSlug === slug);
  if (!row) {
    return NextResponse.json({ ok: false, error: "forbidden_org" }, { status: 403 });
  }
  if (session.member.kind === "child" && slug === "sales") {
    return NextResponse.json({ ok: false, error: "forbidden_org" }, { status: 403 });
  }
  await setActiveOrgCookie(slug);
  return NextResponse.json({ ok: true, org: slug });
}
