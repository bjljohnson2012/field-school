import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { loadImproveDesk } from "@/app/api/coaching/drills/load";
import { DrillRunner } from "./drill-runner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Improve" };

export default async function ImprovePage() {
  const auth = await identityFromRequest();
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/improve");
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="h-page">Improve</h1>
        <section className="card mt-6 p-6">
          <p>A signed-in coaching identity is required.</p>
        </section>
      </main>
    );
  }
  if (auth.identity.kind === "child") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="h-page">Improve</h1>
        <section className="card mt-6 p-6">
          <p>Drills are for the signed-in learner. A tracked child does not run them.</p>
        </section>
      </main>
    );
  }

  try {
    const desk = await loadImproveDesk(auth.identity);
    if (!desk.open) {
      return (
        <main className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="h-page">Improve</h1>
          <section className="card mt-6 p-6">
            <p>Improve is the sales learner desk.</p>
          </section>
        </main>
      );
    }
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/card" className="text-sm text-brand-indigo">
          Back
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{desk.label}</p>
        <h1 className="h-page mt-2">Sharpen one skill at a time</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Pick a skill. Get a real scenario. Type your response. Get instant feedback. Points and streak come from your own attempts.
        </p>
        <DrillRunner skills={desk.skills} stats={desk.stats} />
      </main>
    );
  } catch (error) {
    const unavailable = error instanceof DatabaseUnavailableError;
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="h-page">Improve</h1>
        <section className="card mt-6 p-6">
          <p>{unavailable ? "Drills are unavailable." : "Could not load drills."}</p>
        </section>
      </main>
    );
  }
}
