import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { canTeach } from "@/lib/composer/rules";
import { draftLessonFromPointer } from "../draft-units";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.kind === "child" || !canTeach(auth.identity)) {
    return NextResponse.json(
      { ok: false, error: auth.identity.kind === "child" ? "child_cannot_draft" : "leader_only" },
      { status: 403 },
    );
  }
  if (auth.identity.orgSlug === "household") {
    return NextResponse.json({ ok: false, error: "household_org" }, { status: 403 });
  }

  let body: {
    pointer?: unknown;
    title?: unknown;
    outcome?: unknown;
    chapters?: unknown;
    org?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.org === "string" && body.org.trim() && body.org.trim() !== auth.identity.orgSlug) {
    return NextResponse.json({ ok: false, error: "forbidden_org" }, { status: 403 });
  }

  const result = draftLessonFromPointer({
    org: auth.identity.orgSlug,
    pointer: typeof body.pointer === "string" ? body.pointer : "",
    title: typeof body.title === "string" ? body.title : undefined,
    outcome: typeof body.outcome === "string" ? body.outcome : "",
    chapters: typeof body.chapters === "string" ? body.chapters : undefined,
  });
  if (!result.ok) {
    const status = result.error === "just_locked" || result.error === "dest_locked" ? 403 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    orgId: auth.identity.orgId,
    membershipId: auth.identity.membershipId,
    spec: result.spec,
  });
}
