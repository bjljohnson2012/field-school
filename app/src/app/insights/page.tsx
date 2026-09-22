import type { ReactNode } from "react";
import Link from "next/link";
import { InsightsBoard } from "./charts";
import { loadInsights } from "./load";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Insights",
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Operator</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Insights</h1>
      <div className="mt-8">{children}</div>
    </main>
  );
}

export default async function InsightsPage() {
  const result = await loadInsights();
  if (!result.ok) {
    if (result.error === "sign_in_required") {
      return (
        <Shell>
          <p className="text-muted-foreground">Sign in to see this org.</p>
          <Link href="/login" className="mt-4 inline-flex h-11 items-center text-sm underline underline-offset-4">
            Sign in
          </Link>
        </Shell>
      );
    }
    if (result.error === "child_has_no_login") {
      return (
        <Shell>
          <p>A tracked child has no login on this desk.</p>
        </Shell>
      );
    }
    if (result.error === "hirer_only") {
      return (
        <Shell>
          <p className="text-muted-foreground">Insights is the operator desk for this org.</p>
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
    return (
      <Shell>
        <p className="text-muted-foreground">This org is not active for you.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="mb-6 text-sm text-muted-foreground">{result.model.orgName}</p>
      <InsightsBoard model={result.model} />
    </Shell>
  );
}
