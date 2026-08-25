import type { Metadata } from "next";
import Link from "next/link";
import { checkoutPath } from "@/lib/billing/plans";
import { PORTAL_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Newsletter is free. One course is free. Paid ${PORTAL_NAME} seats and coaching. Pay with a card.`,
};

const portalPlans = [
  {
    name: "One course",
    price: "Free",
    cadence: "",
    body: "Enroll and take one training portal course at your pace.",
    href: "/signup?plan=course",
    label: "Enroll free",
  },
  {
    name: "Up to three courses",
    price: "$10",
    cadence: "per month",
    body: "Keep up to three courses open on your portal.",
    href: checkoutPath("10"),
    label: "Enroll $10",
  },
  {
    name: "More than three courses",
    price: "$50",
    cadence: "per month",
    body: "Open as many courses as you want.",
    href: checkoutPath("50"),
    label: "Enroll $50",
  },
  {
    name: "Certification",
    price: "$1,059",
    cadence: "one time",
    body: "Earn a Field School certificate. Take as long as you need.",
    href: checkoutPath("1059"),
    label: "Enroll $1,059",
  },
];

const coaching = [
  {
    name: "Online cohort",
    price: "$100",
    cadence: "per month",
    body: "One hour a week online. Coaching, direct feedback, and a room you can join from anywhere. Includes the newsletter and unlimited access to the training portal.",
    href: checkoutPath("100"),
  },
  {
    name: "In the room",
    price: "$200",
    cadence: "per month",
    body: "The same hour, in person. Coaching and direct feedback after class. Includes the newsletter and unlimited access to the training portal.",
    href: checkoutPath("200"),
  },
  {
    name: "One-on-one hour",
    price: "$1,000",
    cadence: "per month",
    body: "One hour a week with Ben. Coaching, direct feedback, and help on the work you are actually doing. Includes the newsletter and unlimited access to the training portal.",
    href: checkoutPath("1000"),
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Pricing
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Start free. Pay when you want more.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        The newsletter is free. One course is free. Paid seats take a card on
        Stripe.
      </p>

      <section className="mt-10 rounded-xl border border-border bg-card px-5 py-6">
        <h2 className="font-display text-2xl tracking-tight">Newsletter</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          One email a week. Free.
        </p>
        <Link
          href="https://fieldschool.ai/newsletter"
          className="mt-5 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Join our Newsletter
        </Link>
      </section>

      <h2 className="mt-12 font-display text-2xl tracking-tight">
        Training portal
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {portalPlans.map((plan) => (
          <article
            key={plan.name}
            className="flex flex-col rounded-xl border border-border bg-card px-5 py-6"
          >
            <h3 className="font-display text-2xl tracking-tight">{plan.name}</h3>
            <p className="mt-4 font-display text-4xl tracking-tight">
              {plan.price}
              {plan.cadence ? (
                <span className="ml-1 text-base text-muted-foreground">
                  {plan.cadence}
                </span>
              ) : null}
            </p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
              {plan.body}
            </p>
            <Link
              href={plan.href}
              className="mt-6 inline-flex h-11 items-center text-sm"
            >
              {plan.label}
            </Link>
          </article>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl tracking-tight">
        Learn with Ben
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Each of these seats includes the newsletter, unlimited access to the
        training portal, coaching, direct feedback, and help getting better.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {coaching.map((plan) => (
          <article
            key={plan.name}
            className="flex flex-col rounded-xl border border-border bg-card px-5 py-6"
          >
            <h3 className="font-display text-2xl tracking-tight">{plan.name}</h3>
            <p className="mt-4 font-display text-4xl tracking-tight">
              {plan.price}
              <span className="ml-1 text-base text-muted-foreground">
                {plan.cadence}
              </span>
            </p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
              {plan.body}
            </p>
            <Link
              href={plan.href}
              className="mt-6 inline-flex h-11 items-center text-sm"
            >
              Enroll {plan.price}
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
