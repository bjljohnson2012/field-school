import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getAuthUser, upsertMember, ensureMembership } from "@/lib/campus-runtime/identity";
import { setActiveOrgCookie } from "@/lib/campus-runtime/org";
import { HOUSEHOLD_SLUG } from "@/lib/campus-runtime/rules";
import { getDb } from "@/lib/db/client";
import { syncFamilyMode } from "@/lib/intent/family-mode";
import { applyIntentSqlIfConfigured } from "@/lib/intent/sql";
import { invites, organizations } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/members/policy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "sign_in_required" }, { status: 401 });
  }
  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const token = body.token?.trim() || "";
  if (!token) return NextResponse.json({ ok: false, error: "token_required" }, { status: 400 });
  const db = getDb();
  const [invite] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
  if (!invite) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (invite.status !== "pending" || invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "expired" }, { status: 410 });
  }
  if (normalizeEmail(invite.email) !== user.email) {
    return NextResponse.json({ ok: false, error: "wrong_account" }, { status: 403 });
  }
  const member = await upsertMember(user.email, user.name);
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, invite.orgId))
    .limit(1);
  if (!org) return NextResponse.json({ ok: false, error: "unknown_org" }, { status: 404 });
  await ensureMembership(member.id, org.slug, invite.stance);
  if (
    org.slug === HOUSEHOLD_SLUG &&
    (invite.stance === "guardian" || invite.stance === "admin") &&
    member.kind !== "child"
  ) {
    await applyIntentSqlIfConfigured();
    await syncFamilyMode(member);
  }
  await db
    .update(invites)
    .set({ status: "accepted" })
    .where(and(eq(invites.id, invite.id), eq(invites.status, "pending")));
  await setActiveOrgCookie(org.slug);
  return NextResponse.json({ ok: true, org: org.slug });
}
