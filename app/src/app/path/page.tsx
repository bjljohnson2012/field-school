import type { Metadata } from "next";
import { Suspense } from "react";
import { Fr4ParentPath } from "@/components/fr-4-parent-path";

export const metadata: Metadata = {
  title: "Parent-path assembly",
  description:
    "Path assembled under the selected Child from parent-owned intent. FR-4 / FR-3. Child is not a User.",
};

export const dynamic = "force-dynamic";

export default function PathPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading path…</p>}>
        <Fr4ParentPath />
      </Suspense>
    </main>
  );
}
