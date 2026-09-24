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
    <main className="mx-auto max-w-lg px-6 py-8">
      <p className="eyebrow">Cart</p>
      <h1 className="h-page mt-2">Your seat</h1>

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
            className="btn-primary mt-8"
          >
            See pricing
          </Link>
        </>
      ) : null}

      {plan ? (
        <>
          <article className="card mt-8 px-5 py-6">
            <h2 className="h-section">{plan.name}</h2>
            <p className="mt-4 font-sans text-4xl font-semibold tracking-tight text-foreground">
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
              className="btn-primary justify-center"
            >
              Pay {plan.priceLabel}
            </Link>
            <button
              type="button"
              onClick={clear}
              className="btn justify-center border border-input bg-card text-foreground hover:bg-muted"
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
