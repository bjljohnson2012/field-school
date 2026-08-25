import type { Metadata } from "next";
import Link from "next/link";
import { getPaidPlan } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You're in",
  description: "Payment received. Create a Field School login if you do not have one yet.",
};

type SuccessSearch = {
  plan?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SuccessSearch>;
}) {
  const plan = getPaidPlan(firstValue((await searchParams).plan));
  const seat = plan
    ? `${plan.name} · ${plan.priceLabel}${plan.cadence === "month" ? " a month" : ""}`
    : "your Field School seat";

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Paid
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">You're in.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Stripe took the card for {seat}. Keep a login so the portal remembers
        you.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/signup"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Create a login
        </Link>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm"
        >
          I already have one
        </Link>
      </div>
    </main>
  );
}
