import type { Metadata } from "next";
import Link from "next/link";
import { publicHireRow, readHireActivation } from "@/lib/billing/hire-activation";

export const metadata: Metadata = {
  title: "Hire activation",
  description: "Learn with Ben webhook hire rows. Distribute held. Launch closed.",
};

export const dynamic = "force-dynamic";

export default function OperatorHirePage() {
  const evidence = readHireActivation();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Operator
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Hire activation</h1>
      <p className="mt-4 text-muted-foreground">
        Stripe webhook activates Learn with Ben hire for the locked $100 / $200 /
        $1,000 seats only. Credit ledger stays family-mode. No new dollars.
      </p>
      <dl
        className="mt-8 grid gap-3 text-sm"
        data-hire-activation="operator"
        data-distribute={String(evidence.distribute)}
        data-launch={evidence.launch}
        data-plans={evidence.plans.join(",")}
      >
        <div>
          <dt className="text-muted-foreground">Plans</dt>
          <dd>$100 / $200 / $1,000</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Distribute</dt>
          <dd>HELD</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Launch</dt>
          <dd>{evidence.launch}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rows</dt>
          <dd>{evidence.rows.length}</dd>
        </div>
      </dl>
      <h2 className="mt-10 font-display text-2xl tracking-tight">Evidence rows</h2>
      <ul className="mt-4 space-y-3">
        {evidence.rows.map((row) => {
          const pub = publicHireRow(row);
          return (
            <li
              key={pub.stripe_session_id}
              className="rounded-xl border border-border px-4 py-3 text-sm"
              data-hire-row={pub.plan_id}
              data-hire-activated="true"
            >
              <p>
                Plan {pub.plan_id} · {pub.amount_cents} cents · activated
              </p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {pub.stripe_session_id}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Parent return is{" "}
        <Link href="/metering" className="underline">
          /metering
        </Link>{" "}
        and{" "}
        <Link href="/play/lesson-spine" className="underline">
          /play/lesson-spine
        </Link>
        .
      </p>
    </main>
  );
}
