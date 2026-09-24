import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { visibleNoteRows } from "@/app/api/coaching/notes/route";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { personSurface } from "@/lib/campus-runtime/lessons";
import { assertCanAccessMember, type Actor } from "@/lib/coaching/access";
import { loadCoachingWorld, loadSubjectIdentity } from "@/lib/coaching/scores";
import { getDb } from "@/lib/db/client";
import { coachingNotes } from "@/lib/db/schema";
import { NotesPanel, type NoteItem } from "./notes-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const auth = await identityFromRequest();
  if (!auth.ok) redirect(`/login?next=/people/${membershipId}/notes`);
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
        <h1 className="h-page">Notes</h1>
        <p className="mt-2 text-sm text-gray-600">Not allowed</p>
      </main>
    );
  }
  const surface = personSurface(actor.membershipId, subject.membershipId);
  let notes: NoteItem[] = [];
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(coachingNotes)
      .where(and(eq(coachingNotes.orgId, subject.orgId), eq(coachingNotes.subjectMembershipId, subject.membershipId)))
      .orderBy(desc(coachingNotes.createdAt));
    notes = visibleNoteRows(rows, actor.membershipId, subject.membershipId).map((row) => ({
      id: row.id,
      body: row.body,
      visibleToLearner: row.visibleToLearner,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    notes = [];
  }

  return (
    <main>
      <p className="eyebrow">{subject.stance}</p>
      <h1 className="h-page">Notes</h1>
      <p className="mt-2 text-sm text-gray-600">{subject.name}</p>
      <NotesPanel subjectMembershipId={subject.membershipId} notes={notes} coach={surface === "coach"} />
    </main>
  );
}
