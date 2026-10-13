import type { Metadata } from "next";
import { showsOnHome, type CoachingRecord } from "@/lib/billing/m8-prep";

export const metadata: Metadata = {
  title: "Sessions",
  description: "Published next steps from Coaching.",
};

const records: CoachingRecord[] = [];

export default function LibrarySessionsPage() {
  const steps = records.filter(showsOnHome);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl tracking-tight">Sessions</h1>
      <h2 className="mt-8 font-display text-2xl tracking-tight">Next steps</h2>
      {steps.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No published next steps.</p>
      ) : (
        <ul className="mt-4 list-disc pl-5 text-sm">
          {steps.map((step) => (
            <li key={`${step.orgId}-${step.kind}`}>{step.kind}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
