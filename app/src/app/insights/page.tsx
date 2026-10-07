import type { ReactNode } from "react";
import Link from "next/link";
import { DeskCard, DeskPage, EmptyState } from "@/components/desk/desk";
import { EdgeList } from "@/components/knowledge/edge-list";
import { edgeViews } from "@/lib/knowledge/graph";
import { loadKnowledge } from "@/lib/knowledge/load";
import { InsightsBoard } from "./charts";
import { loadInsights } from "./load";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Insights",
};

const INSIGHTS_LEDE =
  "Insights is a read of this org. It shows who is moving, the next step, and what is already finished. Family shows the children in this home, who do not sign in. A sales org shows the people who do.";

function Shell({ children }: { children: ReactNode }) {
  return (
    <DeskPage eyebrow="Operator" title="Insights" lede={INSIGHTS_LEDE}>
      {children}
    </DeskPage>
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
          <p>A child in this family has no login on this desk.</p>
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

  const household = result.model.orgSlug === "household";
  const people = household ? await loadKnowledge({ kind: "family" }) : null;
  return (
    <Shell>
      <p className="mb-6 text-sm text-muted-foreground">
        {result.model.orgName}
        {" · "}
        <Link href="/knowledge" className="font-medium text-primary">
          Knowledge repository
        </Link>
      </p>
      <InsightsBoard model={result.model} />
      <DeskCard
        data-edges="people-milestones"
        title="People and milestones"
        hint={
          household
            ? "Family. No login. Each line opens to the row it came from."
            : undefined
        }
        className="mt-10"
      >
        {household ? (
          <EdgeList edges={people?.ok ? edgeViews(people.graph) : []} empty="No intake or finished unit yet." />
        ) : (
          <EmptyState>Login learners keep their own milestones on their profile. This desk does not read them.</EmptyState>
        )}
      </DeskCard>
    </Shell>
  );
}
