import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { personSurface } from "@/lib/campus-runtime/lessons";
import { assertCanAccessMember, type Actor } from "@/lib/coaching/access";
import { loadCoachingWorld, loadSubjectIdentity } from "@/lib/coaching/scores";
import { getDb } from "@/lib/db/client";
import { oneOnOnePreps } from "@/lib/db/schema";
import { PrepPanel, type PrepItem } from "./prep-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "1:1 prep" };

function asGenerated(value: unknown): PrepItem["generated"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as PrepItem["generated"];
}

export default async function PrepPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const auth = await identityFromRequest();
  if (!auth.ok) redirect(`/login?next=/people/${membershipId}/prep`);
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
        <h1 className="h-page">1:1 prep</h1>
        <p className="mt-2 text-sm text-muted-foreground">Not allowed</p>
      </main>
    );
  }
  const surface = personSurface(actor.membershipId, subject.membershipId);
  let prep: PrepItem | null = null;
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(oneOnOnePreps)
      .where(
        and(eq(oneOnOnePreps.orgId, subject.orgId), eq(oneOnOnePreps.subjectMembershipId, subject.membershipId)),
      )
      .orderBy(desc(oneOnOnePreps.createdAt))
      .limit(1);
    if (row && surface === "coach") {
      prep = {
        id: row.id,
        status: row.status,
        error: row.error,
        prepDocText: row.prepDocText,
        generated: asGenerated(row.generated),
      };
    }
  } catch {
    prep = null;
  }

  return (
    <main>
      <p className="eyebrow">{subject.stance}</p>
      <h1 className="h-page">1:1 prep</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subject.name}</p>
      <PrepPanel subjectMembershipId={subject.membershipId} prep={prep} coach={surface === "coach"} />
    </main>
  );
}
