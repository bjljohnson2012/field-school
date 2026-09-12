import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { identityFromRequest, ensureMembership } from "@/lib/campus-runtime/identity";
import { HOUSEHOLD_SLUG } from "@/lib/campus-runtime/org";
import { getDb } from "@/lib/db/client";
import { members, wards } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.orgSlug !== HOUSEHOLD_SLUG) {
    return NextResponse.json({ ok: false, error: "household_only" }, { status: 403 });
  }
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_cannot_create" }, { status: 403 });
  }
  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const name = body.name?.trim() || "Child";
  const email = `child.${randomBytes(6).toString("hex")}@household.local`;
  const db = getDb();
  const [child] = await db
    .insert(members)
    .values({ email, name, kind: "child" })
    .returning();
  const { membership } = await ensureMembership(child.id, HOUSEHOLD_SLUG, "learner");
  await db.insert(wards).values({
    orgId: auth.identity.orgId,
    guardianMembershipId: auth.identity.membershipId,
    childMembershipId: membership.id,
  });
  return NextResponse.json({
    ok: true,
    child: { id: child.id, name: child.name, membershipId: membership.id },
  });
}
