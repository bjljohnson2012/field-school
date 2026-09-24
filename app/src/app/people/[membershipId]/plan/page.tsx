import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { personSurface } from "@/lib/campus-runtime/lessons";
import { assertCanAccessMember, type Actor } from "@/lib/coaching/access";
import { loadCoachingWorld, loadSubjectIdentity } from "@/lib/coaching/scores";
import { getDb } from "@/lib/db/client";
import { coachingPlans } from "@/lib/db/schema";
import { PlanPanel, type PlanItem } from "./plan-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plan" };

function asPlan(value: unknown): PlanItem["generated"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as PlanItem["generated"];
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const auth = await identityFromRequest();
  if (!auth.ok) redirect(`/login?next=/people/${membershipId}/plan`);
  const subject = await loadSubjectIdentity(membershipId);
  const actor: Actor = {
    memberId: auth.identity.memberId,
    membershipId: auth.identity.membershipId,
    orgId: auth.identity.orgId,
    stance: auth.identity.stance,
  };
  const world = await loadCoachingWorld(actor);
  const allowed = subject ? assertCanAccessMember(world, actor, subject.membershipId) : null;
  if (!subject || !allowed) {
    return (
      <main>
        <h1 className="h-page">Plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Not allowed</p>
      </main>
    );
  }
  const surface = personSurface(actor.membershipId, subject.membershipId);
  let plan: PlanItem | null = null;
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(coachingPlans)
      .where(and(eq(coachingPlans.orgId, subject.orgId), eq(coachingPlans.subjectMembershipId, subject.membershipId)))
      .orderBy(desc(coachingPlans.createdAt))
      .limit(1);
    if (row) {
      plan = {
        id: row.id,
        status: row.status,
        error: row.error,
        generated: asPlan(row.generated),
      };
    }
  } catch {
    plan = null;
  }

  return (
    <main>
      <p className="eyebrow">{subject.stance}</p>
      <h1 className="h-page">Plan</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subject.name}</p>
      <PlanPanel subjectMembershipId={subject.membershipId} plan={plan} coach={surface === "coach"} />
    </main>
  );
}
