import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { identityFromRequest, ensureMembership } from "@/lib/campus-runtime/identity";
import { HOUSEHOLD_SLUG, canCreateChild } from "@/lib/campus-runtime/org";
import { isStaffEmail } from "@/lib/auth/staff";
import { getDb } from "@/lib/db/client";
import {
  learningEvents,
  members,
  memberProfiles,
  memberships,
  wards,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (!canCreateChild(auth.identity, isStaffEmail(auth.identity.email))) {
    return NextResponse.json({ ok: false, error: "household_guardian_only" }, { status: 403 });
  }
  const db = getDb();
  const rows = await db
    .select({
      wardId: wards.id,
      childMembershipId: wards.childMembershipId,
      name: members.name,
      kind: members.kind,
    })
    .from(wards)
    .innerJoin(memberships, eq(memberships.id, wards.childMembershipId))
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(
      and(
        eq(wards.orgId, auth.identity.orgId),
        eq(wards.guardianMembershipId, auth.identity.membershipId),
      ),
    );
  const children = [];
  for (const row of rows) {
    const events = await db
      .select()
      .from(learningEvents)
      .where(
        and(
          eq(learningEvents.orgId, auth.identity.orgId),
          eq(learningEvents.membershipId, row.childMembershipId),
        ),
      )
      .orderBy(desc(learningEvents.createdAt));
    const welcome = events.some((event) => event.objectId === "home:welcome" && event.kind === "watch");
    const noteRow = events.find((event) => event.objectId === "parent-note");
    const note = typeof (noteRow?.raw as { notes?: string } | null)?.notes === "string"
      ? (noteRow?.raw as { notes: string }).notes
      : "";
    const [profile] = await db
      .select()
      .from(memberProfiles)
      .where(
        and(
          eq(memberProfiles.orgId, auth.identity.orgId),
          eq(memberProfiles.membershipId, row.childMembershipId),
        ),
      )
      .limit(1);
    children.push({
      id: row.wardId,
      name: row.name,
      kind: "child",
      membershipId: row.childMembershipId,
      login: "none",
      welcomeWatched: welcome,
      patternTitle: profile?.bearingPrimary
        ? `${profile.bearingPrimary}${profile.bearingSecondary ? ` / ${profile.bearingSecondary}` : ""}`
        : null,
      note,
    });
  }
  return NextResponse.json({ ok: true, children });
}

export async function PATCH(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (!canCreateChild(auth.identity, isStaffEmail(auth.identity.email))) {
    return NextResponse.json({ ok: false, error: "household_guardian_only" }, { status: 403 });
  }
  let body: { membershipId?: string; note?: string };
  try {
    body = (await request.json()) as { membershipId?: string; note?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const membershipId = body.membershipId?.trim() || "";
  const note = body.note?.trim() || "";
  if (!membershipId) {
    return NextResponse.json({ ok: false, error: "membership_id_required" }, { status: 400 });
  }
  const db = getDb();
  const [ward] = await db
    .select()
    .from(wards)
    .where(
      and(
        eq(wards.orgId, auth.identity.orgId),
        eq(wards.guardianMembershipId, auth.identity.membershipId),
        eq(wards.childMembershipId, membershipId),
      ),
    )
    .limit(1);
  if (!ward) {
    return NextResponse.json({ ok: false, error: "not_your_child" }, { status: 403 });
  }
  await db.insert(learningEvents).values({
    orgId: auth.identity.orgId,
    membershipId,
    actorMembershipId: auth.identity.membershipId,
    actorStance: auth.identity.stance,
    kind: "assignment",
    objectType: "child",
    objectId: "parent-note",
    raw: { notes: note },
  });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (!canCreateChild(auth.identity, isStaffEmail(auth.identity.email))) {
    return NextResponse.json(
      {
        ok: false,
        error: auth.identity.kind === "child" ? "child_cannot_create" : "household_guardian_only",
      },
      { status: 403 },
    );
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
