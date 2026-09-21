import type { Metadata } from "next";
import { Suspense } from "react";
import { Fr5ParentPortion } from "@/components/fr-5-parent-portion";

export const metadata: Metadata = {
  title: "Parent next-portion",
  description:
    "Next slice under the selected Child from the assembled path and parent-owned intent. FR-5. Child is not a User.",
};

export const dynamic = "force-dynamic";

export default function PortionPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading portion…</p>}>
        <Fr5ParentPortion />
      </Suspense>
    </main>
  );
}
