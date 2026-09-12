import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { getDb } from "@/lib/db/client";
import { skillObservations, skills } from "@/lib/db/schema";
import { ensureOrgSkills } from "@/lib/pattern/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await identityFromRequest();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  await ensureOrgSkills(auth.identity.orgId);
  const db = getDb();
  const orgSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.orgId, auth.identity.orgId));
  const observations = await db
    .select()
    .from(skillObservations)
    .where(
      and(
        eq(skillObservations.orgId, auth.identity.orgId),
        eq(skillObservations.membershipId, auth.identity.membershipId),
      ),
    );
  return NextResponse.json({
    ok: true,
    org: auth.identity.orgSlug,
    skills: orgSkills.map((skill) => {
      const rows = observations.filter((row) => row.skillId === skill.id);
      const avg =
        rows.length === 0
          ? null
          : rows.reduce((n, row) => n + Number(row.score || 0), 0) / rows.length;
      return {
        slug: skill.slug,
        name: skill.name,
        hasRubric: Boolean(skill.rubric),
        observations: rows.length,
        score: avg,
      };
    }),
  });
}
