import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { getOrgBySlug } from "@/lib/campus-runtime/org";
import { isStaffEmail } from "@/lib/auth/staff";
import { getDb } from "@/lib/db/client";
import { invites } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/members/policy";

export const dynamic = "force-dynamic";

function canInvite(
  identity: { email: string; stance: string; orgSlug: string; kind: string },
  targetOrg: string,
) {
  if (isStaffEmail(identity.email)) return true;
  if (identity.kind === "child") return false;
  if (identity.orgSlug !== targetOrg) return false;
  return identity.stance === "admin" || identity.stance === "guardian" || identity.stance === "trainer";
}

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_cannot_invite" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const orgSlug = typeof body.org === "string" ? body.org.trim() : auth.identity.orgSlug;
  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  const stance = typeof body.stance === "string" ? body.stance : "learner";
  if (!email) return NextResponse.json({ ok: false, error: "email_required" }, { status: 400 });
  if (!canInvite(auth.identity, orgSlug)) {
    return NextResponse.json({ ok: false, error: "cannot_invite" }, { status: 403 });
  }
  const org = await getOrgBySlug(orgSlug);
  if (!org) return NextResponse.json({ ok: false, error: "unknown_org" }, { status: 404 });
  const token = randomBytes(24).toString("hex");
  const db = getDb();
  const [row] = await db
    .insert(invites)
    .values({
      orgId: org.id,
      email,
      stance,
      token,
      invitedByMembershipId: auth.identity.membershipId,
      status: "pending",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
    .returning();
  return NextResponse.json({
    ok: true,
    invite: {
      org: orgSlug,
      email,
      stance,
      token,
      url: `/invite/${token}`,
      expiresAt: row.expiresAt,
    },
  });
}

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const db = getDb();
  const rows = await db.select().from(invites).where(eq(invites.orgId, auth.identity.orgId));
  return NextResponse.json({
    ok: true,
    invites: rows.map((row) => ({
      email: row.email,
      stance: row.stance,
      status: row.status,
      expiresAt: row.expiresAt,
    })),
  });
}
