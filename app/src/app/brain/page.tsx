import type { Metadata } from "next";
import { Suspense } from "react";
import { FrKb1ParentBrain } from "@/components/fr-kb-1-parent-brain";

export const metadata: Metadata = {
  title: "Knowledge brain",
  description:
    "Parent starts and sees a knowledge brain under the selected Child. FR-KB-1. Child is not a User.",
};

export const dynamic = "force-dynamic";

export default function BrainPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading brain…</p>}>
        <FrKb1ParentBrain />
      </Suspense>
    </main>
  );
}
