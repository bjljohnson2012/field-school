import type { Metadata } from "next";
import { Suspense } from "react";
import { FrKb1ParentBrain } from "@/components/fr-kb-1-parent-brain";
import { EdgeList } from "@/components/knowledge/edge-list";
import { edgeViews } from "@/lib/knowledge/graph";
import { loadKnowledge } from "@/lib/knowledge/load";

export const metadata: Metadata = {
  title: "Knowledge brain",
  description:
    "Parent starts and sees a knowledge brain under the selected Child. FR-KB-1 plus hire-path sync FR-KB-2. Child is not a User.",
};

export const dynamic = "force-dynamic";

export default async function BrainPage() {
  const lessons = await loadKnowledge({ kind: "brains" });
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading brain…</p>}>
        <FrKb1ParentBrain />
      </Suspense>
      {lessons.ok ? (
        <section data-edges="brains" aria-label="Lessons these brains draw on" className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">Lessons these brains draw on</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A brain links to a lesson when one of its sources, notes, or artifacts cites a unit from that lesson.
          </p>
          <div className="mt-4">
            <EdgeList edges={edgeViews(lessons.graph)} empty="No brain item cites a lesson unit yet." />
          </div>
        </section>
      ) : null}
    </main>
  );
}
