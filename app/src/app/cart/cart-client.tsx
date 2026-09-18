"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { checkoutPath, getPaidPlan, isPaidPlanId } from "@/lib/billing/plans";

export function CartClient() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("plan");
  const { ready, planId, writePlan, clear } = useCart();

  useEffect(() => {
    if (isPaidPlanId(requested)) writePlan(requested);
  }, [requested, writePlan]);

  const plan = getPaidPlan(isPaidPlanId(requested) ? requested : planId);

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Cart
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Your seat</h1>

      {!ready ? (
        <p className="mt-4 text-sm text-muted-foreground">Opening your cart…</p>
      ) : null}

      {ready && !plan ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The cart is empty. Pick a training portal seat on Pricing. Learn
            with Ben still opens Stripe from there at $100, $200, or $1,000.
          </p>
          <Link
            href="/pricing"
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            See pricing
          </Link>
        </>
      ) : null}

      {plan ? (
        <>
          <article className="mt-8 rounded-xl border border-border bg-card px-5 py-6">
            <h2 className="font-display text-2xl tracking-tight">{plan.name}</h2>
            <p className="mt-4 font-display text-4xl tracking-tight">
              {plan.priceLabel}
              <span className="ml-1 text-base text-muted-foreground">
                {plan.cadence === "month" ? "per month" : "one time"}
              </span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Pay with a card on Stripe. After pay, this email gets the matching
              Field School seat.
            </p>
          </article>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={checkoutPath(plan.id)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Pay {plan.priceLabel}
            </Link>
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm"
            >
              Remove
            </button>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center text-sm text-muted-foreground"
            >
              Back to pricing
            </Link>
          </div>
        </>
      ) : null}
    </main>
  );
}
