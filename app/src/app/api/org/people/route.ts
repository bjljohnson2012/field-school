import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { isStaffEmail } from "@/lib/auth/staff";
import { getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";
import { canRead, canWrite } from "@/lib/tenancy/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_cannot_list" }, { status: 403 });
  }
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    memberId: auth.identity.memberId,
    orgId: auth.identity.orgId,
    orgSlug: auth.identity.orgSlug,
    orgKind: auth.identity.orgKind,
    stance: auth.identity.stance,
    memberKind: auth.identity.kind,
  };
  const canEdit = canWrite(actor, { orgId: actor.orgId, memberKind: "adult" });
  const allowedOrgs = new Set(auth.memberships.map((row) => row.orgSlug));
  const db = getDb();
  const rows = await db
    .select({
      membershipId: memberships.id,
      memberId: members.id,
      stance: memberships.stance,
      orgId: organizations.id,
      org: organizations.slug,
      orgName: organizations.name,
      name: members.name,
      kind: members.kind,
    })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId));
  const people = staff
    ? rows
    : rows.filter((row) => allowedOrgs.has(row.org) && canRead(actor, { orgId: row.orgId }));
  return NextResponse.json({
    ok: true,
    org: auth.identity.orgSlug,
    staff,
    canEdit,
    people: people.map((row) => ({
      membershipId: row.membershipId,
      name: row.name,
      kind: row.kind,
      stance: row.stance,
      org: row.org,
      orgName: row.orgName,
      login: row.kind === "child" ? "none" : "member",
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const staff = isStaffEmail(auth.identity.email);
  const actor = {
    memberId: auth.identity.memberId,
    orgId: auth.identity.orgId,
    orgSlug: auth.identity.orgSlug,
    orgKind: auth.identity.orgKind,
    stance: auth.identity.stance,
    memberKind: auth.identity.kind,
  };
  if (auth.identity.kind === "child" || (!staff && !canWrite(actor, { orgId: actor.orgId, memberKind: "adult" }))) {
    return NextResponse.json({ ok: false, error: "admin_only" }, { status: 403 });
  }
  let body: { updates?: unknown };
  try {
    body = (await request.json()) as { updates?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const updates = Array.isArray(body.updates) ? body.updates.slice(0, 40) : [];
  const allowedOrgs = new Set(auth.memberships.map((row) => row.orgSlug));
  const db = getDb();
  let saved = 0;
  for (const item of updates) {
    if (!item || typeof item !== "object") continue;
    const row = item as { membershipId?: unknown; name?: unknown };
    const membershipId = typeof row.membershipId === "string" ? row.membershipId.trim() : "";
    const name = typeof row.name === "string" ? row.name.replace(/\s+/g, " ").trim().slice(0, 80) : "";
    if (!membershipId || name.length < 2) continue;
    const [membership] = await db
      .select({
        memberId: memberships.memberId,
        org: organizations.slug,
        orgId: organizations.id,
        kind: members.kind,
      })
      .from(memberships)
      .innerJoin(members, eq(members.id, memberships.memberId))
      .innerJoin(organizations, eq(organizations.id, memberships.orgId))
      .where(eq(memberships.id, membershipId))
      .limit(1);
    if (!membership) continue;
    const subject = {
      orgId: membership.orgId,
      memberId: membership.memberId,
      memberKind: membership.kind,
      login: membership.kind === "child" ? "none" : "member",
    };
    if (!canWrite(actor, subject)) continue;
    if (!staff && !allowedOrgs.has(membership.org)) continue;
    await db.update(members).set({ name }).where(eq(members.id, membership.memberId));
    saved += 1;
  }
  return NextResponse.json({ ok: true, saved });
}
