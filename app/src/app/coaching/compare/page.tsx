import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { compareRoster } from "@/app/api/coaching/compare/load";
import { loadTaskActor } from "@/app/api/coaching/tasks/session";
import { ComparePanel, type ComparePerson } from "./compare-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare" };

export default async function ComparePage() {
  const loaded = await loadTaskActor();
  if (!loaded.ok) {
    if (loaded.status === 401) redirect("/login?next=/coaching/compare");
    return (
      <main>
        <h1 className="h-page">Compare</h1>
        <section className="card mt-6 p-6">
          <p>No one to compare in this org.</p>
        </section>
      </main>
    );
  }

  let aes: ComparePerson[] = [];
  let directors: ComparePerson[] = [];
  try {
    const roster = await compareRoster(loaded.world, loaded.actor);
    aes = roster.aes;
    directors = roster.directors;
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }

  return (
    <main>
      <h1 className="h-page">Compare</h1>
      <p className="mt-2 text-sm text-muted-foreground">Compare AEs and directors in the active org.</p>
      <ComparePanel aes={aes} directors={directors} actorMembershipId={loaded.actor.membershipId} />
    </main>
  );
}
