import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { listLearnerUnits } from "@/app/api/coaching/knowledge/library";
import { learnerCanReadUnit } from "@/app/api/coaching/knowledge/visibility";
import { DeskPage } from "@/components/desk/desk";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { loadNetworks } from "../networks/load";
import { NetworkBoard } from "../networks/network-board";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Knowledge",
};

const LEDE =
  "Every document stored for this org is listed here, with a plain label. Expand one when you want a short reading and a follow-up question.";

function Shell({ children }: { children: ReactNode }) {
  return (
    <DeskPage eyebrow="Knowledge" title="Knowledge repository" lede={LEDE}>
      {children}
    </DeskPage>
  );
}

export default async function KnowledgePage() {
  const auth = await identityFromRequest();
  if (!auth.ok) {
    if (auth.error === "sign_in_required") redirect("/login?next=/knowledge");
    redirect("/login?next=/knowledge");
  }

  const result = await loadNetworks();
  if (result.ok) {
    return (
      <Shell>
        <p className="mb-6 text-sm text-muted-foreground">{result.model.orgName}</p>
        <NetworkBoard model={result.model} />
      </Shell>
    );
  }
  if (result.error === "child_has_no_login") {
    return (
      <Shell>
        <p>A child in this family has no login on this desk.</p>
      </Shell>
    );
  }
  if (result.error === "database_unavailable") {
    return (
      <Shell>
        <p className="text-muted-foreground">The campus database is not connected.</p>
      </Shell>
    );
  }
  if (result.error !== "hirer_only") {
    return (
      <Shell>
        <p className="text-muted-foreground">This org is not active for you.</p>
      </Shell>
    );
  }

  let units: Awaited<ReturnType<typeof listLearnerUnits>> = [];
  try {
    units = (await listLearnerUnits(auth.identity.orgId)).filter((unit) => learnerCanReadUnit(unit));
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }

  return (
    <main>
      <h1 className="h-page">Knowledge</h1>
      <p className="mt-2 text-sm text-gray-600">Signed in as {auth.identity.name}</p>
      {units.length ? (
        <ul className="mt-6 space-y-4">
          {units.map((unit) => (
            <li key={unit.id} className="card p-4">
              <h2 className="font-semibold">{unit.title}</h2>
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
