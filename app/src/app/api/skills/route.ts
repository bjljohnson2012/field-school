import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { HOUSEHOLD_SLUG, SALES_SLUG } from "@/lib/campus-runtime/org";
import { HOUSEHOLD_SKILLS, SALES_SKILLS } from "@/lib/campus-runtime/lessons";
import { getDb } from "@/lib/db/client";
import { skillStates, skills } from "@/lib/db/schema";
import { recordEvent } from "@/lib/campus-runtime/events";

export const dynamic = "force-dynamic";

async function seedSkills(orgId: string, orgSlug: string) {
  const db = getDb();
  const defs = orgSlug === SALES_SLUG ? SALES_SKILLS : orgSlug === HOUSEHOLD_SLUG ? HOUSEHOLD_SKILLS : [];
  for (const skill of defs) {
    await db
      .insert(skills)
      .values({ orgId, slug: skill.slug, name: skill.name, rubric: { prompt: skill.prompt } })
      .onConflictDoNothing({ target: [skills.orgId, skills.slug] });
  }
}

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  await seedSkills(auth.identity.orgId, auth.identity.orgSlug);
  const db = getDb();
  const orgSkills = await db.select().from(skills).where(eq(skills.orgId, auth.identity.orgId));
  const states = await db
    .select()
    .from(skillStates)
    .where(
      and(
        eq(skillStates.orgId, auth.identity.orgId),
        eq(skillStates.membershipId, auth.identity.membershipId),
      ),
    );
  return NextResponse.json({
    ok: true,
    org: auth.identity.orgSlug,
    editable: auth.identity.orgSlug === HOUSEHOLD_SLUG && auth.identity.kind !== "child",
    skills: orgSkills.map((skill) => {
      const state = states.find((row) => row.skillId === skill.id);
      return {
        id: skill.id,
        slug: skill.slug,
        name: skill.name,
        prompt: (skill.rubric as { prompt?: string } | null)?.prompt ?? "",
        score: state?.score == null ? null : Number(state.score),
      };
    }),
  });
}

export async function PUT(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.orgSlug !== HOUSEHOLD_SLUG || auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "parent_only" }, { status: 403 });
  }
  let body: { skills?: { id?: string; name?: string; prompt?: string }[] };
  try {
    body = (await request.json()) as { skills?: { id?: string; name?: string; prompt?: string }[] };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const db = getDb();
  for (const skill of body.skills ?? []) {
    if (!skill.id) continue;
    await db
      .update(skills)
      .set({
        name: skill.name ?? "",
        rubric: { prompt: skill.prompt ?? "" },
      })
      .where(and(eq(skills.id, skill.id), eq(skills.orgId, auth.identity.orgId)));
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  let body: { scores?: Record<string, number> };
  try {
    body = (await request.json()) as { scores?: Record<string, number> };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const db = getDb();
  await seedSkills(auth.identity.orgId, auth.identity.orgSlug);
  const orgSkills = await db.select().from(skills).where(eq(skills.orgId, auth.identity.orgId));
  for (const skill of orgSkills) {
    const score = body.scores?.[skill.slug];
    if (typeof score !== "number") continue;
    await db
      .insert(skillStates)
      .values({
        orgId: auth.identity.orgId,
        membershipId: auth.identity.membershipId,
        skillId: skill.id,
        score: String(score),
        raw: { score },
      })
      .onConflictDoUpdate({
        target: [skillStates.orgId, skillStates.membershipId, skillStates.skillId],
        set: { score: String(score), raw: { score }, updatedAt: new Date() },
      });
    await recordEvent(auth.identity, {
      kind: "diagnostic",
      objectType: "skill",
      objectId: skill.slug,
      score,
      raw: { org: auth.identity.orgSlug },
    });
  }
  return NextResponse.json({ ok: true });
}
