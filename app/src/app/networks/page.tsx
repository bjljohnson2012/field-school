import type { ReactNode } from "react";
import Link from "next/link";
import { DeskPage } from "@/components/desk/desk";
import { loadNetworks } from "./load";
import { NetworkBoard } from "./network-board";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Networks",
};

const LEDE =
  "Networks is the knowledge stored for this org. Each piece sits on the map. Open one to read its units. Generated means a quiz was written from that knowledge.";

function Shell({ children }: { children: ReactNode }) {
  return (
    <DeskPage eyebrow="Networks" title="Knowledge repository" lede={LEDE}>
      {children}
    </DeskPage>
  );
}

export default async function NetworksPage() {
  const result = await loadNetworks();
  if (!result.ok) {
    if (result.error === "sign_in_required") {
      return (
        <Shell>
          <p className="text-muted-foreground">Sign in to see this org.</p>
          <Link href="/login?next=/networks" className="mt-4 inline-flex h-11 items-center text-sm underline underline-offset-4">
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
          <p className="text-muted-foreground">Networks is the operator desk for this org.</p>
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
      <NetworkBoard model={result.model} />
    </Shell>
  );
}
