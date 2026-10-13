import type { Metadata } from "next";
import Link from "next/link";
import { CHECKOUT_GO_LIVE } from "@/lib/billing/checkout-destination";
import { coachingAction } from "@/lib/billing/m8-prep";
import {
  coachingTiers,
  consultingMailto,
  freeCourseHref,
  individualOffer,
} from "@/lib/billing/offer-names";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Coaching is $300, $600, or $1,500 a month. One course is free. Email Ben to start. No card on the free course.",
};

function coachingButton(tier: "assess" | "model" | "build") {
  const action = coachingAction({
    tier,
    mode: CHECKOUT_GO_LIVE ? "test" : "off",
  });
  if (action.kind === "email") return action.href;
  return "/pricing";
}

export default function PricingPage() {
  const hidden = individualOffer();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Pricing
      </p>
      <h1 className="mt-3 max-w-[16ch] font-display text-5xl leading-[1.02] tracking-[-0.035em] sm:text-6xl">
        Coaching
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        $300, $600, or $1,500 a month. Every plan includes the portal, the
        Saturday email, and your knowledge brain.
      </p>
      <p className="mt-4 text-sm leading-relaxed">One course is free. No card.</p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A leader buys the same seat. The work is the team&apos;s standard, not a
        different price.
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        In person in Dayton is available when you are both there.
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Short on time? One Saturday email a week still keeps your people moving.
      </p>

      <article className="mt-10 rounded-2xl border border-border bg-card px-5 py-6">
        <h2 className="font-display text-2xl tracking-tight">One course</h2>
        <p className="mt-4 font-display text-4xl tracking-tight">Free</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          One course is free. No card.
        </p>
        <Link
          href={freeCourseHref}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Start free
        </Link>
      </article>

      <h2 className="mt-12 font-display text-2xl tracking-tight">Coaching</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {coachingTiers.map((tier) => (
          <article
            key={tier.key}
            className="flex flex-col rounded-2xl border border-border bg-card px-5 py-6"
          >
            <h3 className="font-display text-2xl tracking-tight">
              {tier.name}. {tier.priceLabel} {tier.cadence}.
            </h3>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
              {tier.line}
            </p>
            <a
              href={coachingButton(tier.key)}
              className="mt-6 inline-flex h-11 w-fit items-center rounded-xl border border-border px-4 text-sm"
            >
              Email Ben
            </a>
          </article>
        ))}
      </div>
      {hidden}

      <article className="mt-8 rounded-2xl border border-border bg-card px-5 py-6">
        <h2 className="font-display text-2xl tracking-tight">Consulting</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Scoped work. No public price.
        </p>
        <a
          href={consultingMailto}
          className="mt-6 inline-flex h-11 w-fit items-center rounded-xl border border-border px-4 text-sm"
        >
          Email Ben
        </a>
      </article>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Not ready? Start with one free course or the{" "}
        <a className="underline" href="https://fieldschool.ai/assessment">
          free assessment
        </a>
        .
      </p>
    </main>
  );
}
