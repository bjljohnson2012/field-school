import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { listLibrary } from "@/app/api/coaching/knowledge/library";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { KnowledgeEditor, type KnowledgeRepo, type KnowledgeUnit } from "./knowledge-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge" };

export default async function CoachingKnowledgePage() {
  const loaded = await loadLibraryCoach();
  if (!loaded.ok) {
    if (loaded.response.status === 401) redirect("/login?next=/coaching/knowledge");
    return (
      <main>
        <h1 className="h-page">Knowledge</h1>
        <section className="card mt-6 p-6">
          <p>Knowledge editing is limited to coaches.</p>
        </section>
      </main>
    );
  }

  let repos: KnowledgeRepo[] = [];
  let units: KnowledgeUnit[] = [];
  try {
    const library = await listLibrary(loaded.actor.orgId);
    repos = library.repos;
    units = library.units;
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }

  return (
    <main>
      <h1 className="h-page">Knowledge</h1>
      <p className="mt-2 text-sm text-gray-600">Signed in as {loaded.name}</p>
      <KnowledgeEditor initialRepos={repos} initialUnits={units} />
    </main>
  );
}
