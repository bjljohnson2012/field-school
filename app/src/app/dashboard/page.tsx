import Link from "next/link";
import { DiscoverButton } from "@/components/m9/discover-button";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10" data-home="m9">
      <h1 className="font-display text-4xl tracking-tight">What is next</h1>
      <p className="mt-4 text-sm text-muted-foreground">No next step in this brain yet.</p>
      <div className="mt-6">
        <DiscoverButton href="/learn">Continue</DiscoverButton>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/insights">Insights</Link> keeps the longer report.
      </p>
    </main>
  );
}
