import type { Metadata } from "next";
import { Suspense } from "react";
import { Fr6SupervisedProgress } from "@/components/fr-6-supervised-progress";

export const metadata: Metadata = {
  title: "Parent-supervised progress",
  description:
    "Now / Confidence / Next under the selected Child. FR-6 / FR-2. Child is not a User.",
};

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading progress…</p>}>
        <Fr6SupervisedProgress />
      </Suspense>
    </main>
  );
}
