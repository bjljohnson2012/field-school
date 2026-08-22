import type { Metadata } from "next";
import Link from "next/link";
import { UNI_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Free beta membership and later invoice plans at ${UNI_NAME}.`,
};

const plans = [
  {
    name: "Cohort meetings online",
    price: "$100",
    cadence: "per month",
    body: "Live cohort sessions on the campus calendar. Built for operators who can show up from anywhere.",
  },
  {
    name: "Cohort meetings in person",
    price: "$200",
    cadence: "per month",
    body: "The same cohort, in the room. For people who want the hallway conversations after class.",
  },
  {
    name: "One-on-one AI + business coaching",
    price: "$1,000",
    cadence: "per month",
    body: "Direct coaching on the AI staff and the business work you are actually running.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Pricing
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Join free now. Paid plans are invoiced later.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Field School University is in free beta. Members get campus access
        without a card. When paid cohorts open, we invoice. There is no checkout
        on this page.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="flex flex-col rounded-xl border border-border bg-card px-5 py-6"
          >
            <h2 className="font-display text-2xl tracking-tight">{plan.name}</h2>
            <p className="mt-4 font-display text-4xl tracking-tight">
              {plan.price}
              <span className="ml-1 text-base text-muted-foreground">
                {plan.cadence}
              </span>
            </p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
              {plan.body}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Invoice later
            </p>
          </article>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-border bg-card px-5 py-6">
        <h2 className="font-display text-2xl tracking-tight">Free beta</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Beta members keep a dashboard, walk courses, and take assessments now.
          Staff admin stays invite-only. Paid seats will be billed by invoice
          when those rooms open. Do not enter a card here.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Join the free beta
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
