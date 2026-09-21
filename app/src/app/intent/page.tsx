import type { Metadata } from "next";
import { Suspense } from "react";
import { Fr3ParentIntent } from "@/components/fr-3-parent-intent";

export const metadata: Metadata = {
  title: "Parent-owned intent",
  description:
    "Parent captures intent under the selected Child. FR-3 / FR-2. Child is not a User.",
};

export const dynamic = "force-dynamic";

export default function IntentPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading intent…</p>}>
        <Fr3ParentIntent />
      </Suspense>
    </main>
  );
}
