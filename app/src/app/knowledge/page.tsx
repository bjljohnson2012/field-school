import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listLearnerUnits } from "@/app/api/coaching/knowledge/library";
import { learnerCanReadUnit } from "@/app/api/coaching/knowledge/visibility";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge" };

export default async function LearnerKnowledgePage() {
  const auth = await identityFromRequest();
  if (!auth.ok) redirect("/login?next=/knowledge");

  let units: Awaited<ReturnType<typeof listLearnerUnits>> = [];
  try {
    units = (await listLearnerUnits(auth.identity.orgId)).filter((unit) => learnerCanReadUnit(unit));
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }

  return (
    <main>
      <h1 className="h-page">Knowledge</h1>
      <p className="mt-2 text-sm text-muted-foreground">Signed in as {auth.identity.name}</p>
      {units.length ? (
        <ul className="mt-6 space-y-4">
          {units.map((unit) => (
            <li key={unit.id} className="card p-4">
              <h2 className="h-section">{unit.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{unit.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <section className="card mt-6 p-6">
          <p>No approved articles yet.</p>
        </section>
      )}
    </main>
  );
}
